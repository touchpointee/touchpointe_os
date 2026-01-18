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

        public async Task<DashboardDataDto> GetDashboardDataAsync(Guid workspaceId, Guid userId)
        {
            var today = DateTime.UtcNow.Date;

            // 1. Stats
            var openTasks = await _context.Tasks
                .CountAsync(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId && t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE);
            
            var dueToday = await _context.Tasks
                .CountAsync(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId && t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE && t.DueDate.HasValue && t.DueDate.Value.Date == today);

            var overdue = await _context.Tasks
                .CountAsync(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId && t.Status != Touchpointe.Domain.Entities.TaskStatus.DONE && t.DueDate.HasValue && t.DueDate.Value.Date < today);

            var activeDeals = await _context.Deals
                .CountAsync(d => d.WorkspaceId == workspaceId && d.Stage != DealStage.CLOSED_WON && d.Stage != DealStage.CLOSED_LOST);

            var completedToday = await _context.Tasks
                .CountAsync(t => t.WorkspaceId == workspaceId && t.AssigneeId == userId && t.Status == Touchpointe.Domain.Entities.TaskStatus.DONE && t.UpdatedAt.Date == today);

            // 2. My Tasks (Top 30 due soon)
            var myTasks = await _context.Tasks
                .Include(t => t.Assignee)
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
                    t.CreatedBy != null ? t.CreatedBy.FullName : "",
                    t.DueDate,
                    t.OrderIndex,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.SubDescription,
                    t.CustomStatus,
                    t.Tags.Select(tg => new TagDto(tg.Id, tg.Name, tg.Color)).ToList()
                ))
                .ToListAsync();

            // 3. Recent Activity (Task + CRM)
            var taskActivities = await _context.TaskActivities
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
                .ToListAsync();

            var crmActivities = await _context.CrmActivities
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
                .ToListAsync();

            // Merge and Sort
            var recentActivity = taskActivities
                .Concat(crmActivities)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToList();

            return new DashboardDataDto
            {
                Stats = new DashboardStatsDto
                {
                    OpenTasks = openTasks,
                    DueToday = dueToday,
                    Overdue = overdue,
                    ActiveDeals = activeDeals,
                    CompletedTasksToday = completedToday
                },
                MyTasks = myTasks,
                RecentActivity = recentActivity
            };
        }
    }
}
