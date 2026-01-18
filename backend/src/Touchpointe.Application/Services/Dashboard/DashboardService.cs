using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities; // for activities

namespace Touchpointe.Application.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IApplicationDbContext _context;

        public DashboardService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardDataDto> GetDashboardDataAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default)
        {
            var today = DateTime.UtcNow.Date;

            // 1. Task Stats (Aggregated Query)
            var taskStatsTask = _context.Tasks
                .Where(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId)
                .GroupBy(x => 1)
                .Select(g => new
                {
                    Open = g.Count(t => t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE),
                    DueToday = g.Count(t => t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE && t.DueDate.HasValue && t.DueDate.Value.Date == today),
                    Overdue = g.Count(t => t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE && t.DueDate.HasValue && t.DueDate.Value.Date < today),
                    CompletedToday = g.Count(t => t.Status == Touchpointe.Domain.Entities.TaskStatus.DONE && t.UpdatedAt.Date == today)
                })
                .FirstOrDefaultAsync(cancellationToken);

            // 2. Active Deals
            var activeDealsTask = _context.Deals
                .CountAsync(d => d.WorkspaceId == workspaceId && d.Stage != DealStage.CLOSED_WON && d.Stage != DealStage.CLOSED_LOST, cancellationToken);

            // 3. My Tasks (Top 30 due soon)
            var myTasksTask = _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy) // Include CreatedBy to prevent null reference in Select
                .Include(t => t.Tags)
                .Where(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId && t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE)
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(t => t.Priority)
                .Take(30)
                .Select(t => new TaskDto(
                    t.Id,
                    t.WorkspaceId,
                    t.ListId,
                    t.Title,
                    t.Description,
                    t.Status.ToString(),
                    t.Priority.ToString(),
                    t.AssigneeId,
                    t.Assignee != null ? t.Assignee.FullName : "",
                    t.Assignee != null ? t.Assignee.AvatarUrl : null,
                    t.CreatedById,
                    t.CreatedBy != null ? t.CreatedBy.FullName : "", // Null handling
                    t.DueDate,
                    t.OrderIndex,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.SubDescription,
                    t.CustomStatus,
                    t.Tags.Select(tg => new TagDto(tg.Id, tg.Name, tg.Color)).ToList()
                ))
                .ToListAsync(cancellationToken);

            // 4. Recent Activity (Task + CRM) in Parallel
            var taskActivitiesTask = _context.TaskActivities
                .Include(a => a.ChangedBy)
                .Where(a => a.Task.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.Timestamp)
                .Take(10)
                .Select(a => new DashboardActivityDto
                {
                    Id = a.Id.ToString(),
                    Type = "Task",
                    Description = a.ChangedBy.FullName + " " + a.ActivityType.ToString() + (a.NewValue != null ? ": " + a.NewValue : ""),
                    CreatedAt = a.Timestamp,
                    UserInitial = a.ChangedBy.FullName.Substring(0, 1),
                    LinkId = a.TaskId.ToString()
                })
                .ToListAsync(cancellationToken);

            var crmActivitiesTask = _context.CrmActivities
                .Include(a => a.User)
                .Where(a => a.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new DashboardActivityDto
                {
                    Id = a.Id.ToString(),
                    Type = "Deal",
                    Description = a.User.FullName + " " + a.ActionType.ToString() + " " + a.EntityType.ToString() + (a.NewValue != null ? ": " + a.NewValue : ""),
                    CreatedAt = a.CreatedAt,
                    UserInitial = a.User.FullName.Substring(0, 1),
                    LinkId = a.EntityId.ToString()
                })
                .ToListAsync(cancellationToken);

            // Execute all in parallel
            await Task.WhenAll(taskStatsTask, activeDealsTask, myTasksTask, taskActivitiesTask, crmActivitiesTask);

            var taskStats = await taskStatsTask; // Result

            // Merge Activities
            var recentActivity = (await taskActivitiesTask)
                .Concat(await crmActivitiesTask)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToList();

            return new DashboardDataDto
            {
                Stats = new DashboardStatsDto
                {
                    OpenTasks = taskStats?.Open ?? 0,
                    DueToday = taskStats?.DueToday ?? 0,
                    Overdue = taskStats?.Overdue ?? 0,
                    ActiveDeals = await activeDealsTask,
                    CompletedTasksToday = taskStats?.CompletedToday ?? 0
                },
                MyTasks = await myTasksTask,
                RecentActivity = recentActivity
            };
        }
    }
}
