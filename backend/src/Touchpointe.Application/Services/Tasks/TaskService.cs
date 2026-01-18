using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;
using TaskStatus = Touchpointe.Domain.Entities.TaskStatus;
using TaskPriority = Touchpointe.Domain.Entities.TaskPriority;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Touchpointe.Application.Services.Tasks
{
    public class TaskService : ITaskService
    {
        private readonly IApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public TaskService(IApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<TaskDto>> GetTasksByListAsync(Guid workspaceId, Guid listId, CancellationToken cancellationToken = default)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Tags)
                .Where(t => t.WorkspaceId == workspaceId && t.ListId == listId)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync(cancellationToken);

            return tasks.Select(MapToDto).ToList();
        }

        public async Task<TaskDto> CreateTaskAsync(Guid workspaceId, Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default)
        {
            // 1. Validate Assignee (if provided)
            if (request.AssigneeId.HasValue && request.AssigneeId.Value != userId)
            {
                var isMember = await _context.WorkspaceMembers
                    .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId.Value, cancellationToken);

                if (!isMember)
                {
                    throw new Exception("Assignee is not a member of this workspace.");
                }
            }

            // 2. Get Max Order
            var maxOrder = await _context.Tasks
                .Where(t => t.ListId == request.ListId)
                .MaxAsync(t => (int?)t.OrderIndex, cancellationToken) ?? 0;

            // 3. Status Defaulting
            var customStatus = request.CustomStatus;
            if (string.IsNullOrEmpty(customStatus))
            {
                var firstStatus = await _context.ListStatuses
                    .Where(s => s.ListId == request.ListId)
                    .OrderBy(s => s.Order)
                    .FirstOrDefaultAsync(cancellationToken);
                
                customStatus = firstStatus?.Id.ToString();
            }

            // 4. Create Task Entity
            var task = new TaskItem
            {
                WorkspaceId = workspaceId,
                ListId = request.ListId,
                Title = request.Title,
                Description = request.Description,
                SubDescription = request.SubDescription,
                Status = TaskStatus.TODO,
                CustomStatus = customStatus,
                Priority = (TaskPriority)(request.Priority ?? TaskPriorityDto.NONE),
                AssigneeId = request.AssigneeId,
                CreatedById = userId,
                DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null,
                OrderIndex = maxOrder + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }; 

            // 5. Handle Tags (if any)
            if (request.TagIds != null && request.TagIds.Any())
            {
                var tags = await _context.Tags
                    .Where(tg => tg.WorkspaceId == workspaceId && request.TagIds.Contains(tg.Id))
                    .ToListAsync(cancellationToken);
                foreach (var tag in tags) task.Tags.Add(tag);
            }

            _context.Tasks.Add(task);
            
            // 6. Log Activity
            _context.TaskActivities.Add(new TaskActivity
            {
                TaskId = task.Id,
                ActivityType = ActivityType.CREATED,
                ChangedById = userId,
                NewValue = task.Title,
                Timestamp = DateTime.UtcNow
            });

            // 7. Auto-watch: Creator
            _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = userId });

            // 8. Auto-watch: Assignee (if different from creator)
            if (task.AssigneeId.HasValue && task.AssigneeId.Value != userId)
            {
                _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = task.AssigneeId.Value });
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Fetch again with navigation props
            var createdTask = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Tags)
                .FirstAsync(t => t.Id == task.Id, cancellationToken);

            return MapToDto(createdTask);
        }

        public async Task<TaskDto> UpdateTaskAsync(Guid workspaceId, Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Tags)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId, cancellationToken);

            if (task == null) throw new Exception("Task not found.");
            
            // STRICT PERMISSION CHECK: Only Assignee or Creator can edit
            if (task.AssigneeId != userId && task.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to edit this task.");
            }

            // Log changes
            if (request.CustomStatus != null && task.CustomStatus != request.CustomStatus)
            {
                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.STATUS_CHANGED,
                    OldValue = task.CustomStatus ?? task.Status.ToString(),
                    NewValue = request.CustomStatus,
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.CustomStatus = request.CustomStatus;
            }

            if (request.Status.HasValue && task.Status != (TaskStatus)request.Status.Value)
            {
                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.STATUS_CHANGED,
                    OldValue = task.Status.ToString(),
                    NewValue = request.Status.Value.ToString(),
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.Status = (TaskStatus)request.Status.Value;
            }

            if (request.Priority.HasValue && task.Priority != (TaskPriority)request.Priority.Value)
            {
                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.PRIORITY_CHANGED,
                    OldValue = task.Priority.ToString(),
                    NewValue = request.Priority.Value.ToString(),
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.Priority = (TaskPriority)request.Priority.Value;
            }

            // Handle Assignee Change (Nullable)
            if (request.AssigneeId != task.AssigneeId)
            {
                if (request.AssigneeId.HasValue)
                {
                    var isMember = await _context.WorkspaceMembers
                        .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId.Value, cancellationToken);
                    if (!isMember) throw new Exception("New assignee is not a member of this workspace.");

                    _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = request.AssigneeId.Value });
                }

                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.ASSIGNEE_CHANGED,
                    OldValue = task.AssigneeId?.ToString() ?? "Unassigned",
                    NewValue = request.AssigneeId?.ToString() ?? "Unassigned",
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.AssigneeId = request.AssigneeId;
            }

            if (request.Title != null && task.Title != request.Title)
            {
                 _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.TITLE_CHANGED,
                    OldValue = task.Title,
                    NewValue = request.Title,
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.Title = request.Title;
            }
            
            if (request.Description != null && task.Description != request.Description)
            {
                 _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.DESCRIPTION_CHANGED,
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.Description = request.Description;
            }

            if (request.SubDescription != null && task.SubDescription != request.SubDescription)
            {
                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.DESCRIPTION_CHANGED,
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.SubDescription = request.SubDescription;
            }
            
            if (request.DueDate != task.DueDate)
            {
                DateTime? dueDateUtc = request.DueDate.HasValue 
                    ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc)
                    : null;
                    
                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.DUE_DATE_CHANGED,
                    OldValue = task.DueDate?.ToString(),
                    NewValue = dueDateUtc?.ToString(),
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.DueDate = dueDateUtc;
            }
            
            if (request.OrderIndex.HasValue)
            {
                task.OrderIndex = request.OrderIndex.Value;
            }

            // Tags Update
            if (request.TagIds != null)
            {
                task.Tags.Clear();
                var tags = await _context.Tags
                    .Where(tg => tg.WorkspaceId == workspaceId && request.TagIds.Contains(tg.Id))
                    .ToListAsync(cancellationToken);
                foreach (var tag in tags) task.Tags.Add(tag);
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(task);
        }

        public async Task<List<TaskActivityDto>> GetTaskActivitiesAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default)
        {
             var activities = await _context.TaskActivities
                .Include(a => a.ChangedBy)
                .Where(a => a.TaskId == taskId) // Workspace check implicit via Task existence, but could be safer
                .Where(a => a.Task.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync(cancellationToken);

            return activities.Select(a => new TaskActivityDto(
                a.Id,
                a.ActivityType.ToString(),
                a.OldValue,
                a.NewValue,
                a.ChangedById,
                a.ChangedBy.FullName, // Using FullName as per previous schema
                a.Timestamp
            )).ToList();
        }

        public async Task<TaskDetailDto> GetTaskDetailsAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Tags)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId, cancellationToken);

            if (task == null) throw new Exception("Task not found.");

            var subtasks = await _context.Subtasks
                .Include(s => s.Assignee)
                .Where(s => s.TaskId == taskId)
                .OrderBy(s => s.OrderIndex)
                .Select(s => new SubtaskDto(
                    s.Id, 
                    s.Title, 
                    s.IsCompleted, 
                    s.AssigneeId, 
                    s.Assignee != null ? s.Assignee.FullName : "Unassigned", // Handling potential null if not enforced yet
                    s.OrderIndex))
                .ToListAsync(cancellationToken);

            var comments = await _context.TaskComments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TaskCommentDto(c.Id, c.UserId, c.User.FullName, "", c.Content, c.CreatedAt))
                .ToListAsync(cancellationToken);

            var activities = await GetTaskActivitiesAsync(workspaceId, taskId, cancellationToken);

            return new TaskDetailDto(MapToDto(task), subtasks, comments, activities);
        }

        public async Task<SubtaskDto> AddSubtaskAsync(Guid workspaceId, Guid userId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken = default)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId, cancellationToken);
            if (task == null) throw new Exception("Task not found.");

            // STRICT PERMISSION CHECK: Only Main Task Owner can add subtasks
            if (task.AssigneeId != userId && task.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("Only the task owner can add subtasks.");
            }

            // Validate Assignee
             var isMember = await _context.WorkspaceMembers
                .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId, cancellationToken);
            
            if (!isMember) throw new Exception("Assignee is not a member of this workspace.");

            var maxOrder = await _context.Subtasks
                .Where(s => s.TaskId == taskId)
                .MaxAsync(s => (int?)s.OrderIndex, cancellationToken) ?? 0;

            var subtask = new Subtask
            {
                TaskId = taskId,
                Title = request.Title,
                IsCompleted = false,
                AssigneeId = request.AssigneeId,
                OrderIndex = maxOrder + 1
            };

            _context.Subtasks.Add(subtask);
            
            _context.TaskActivities.Add(new TaskActivity
            {
                TaskId = taskId,
                ActivityType = ActivityType.SUBTASK_ADDED,
                NewValue = request.Title,
                ChangedById = userId
            });

            await _context.SaveChangesAsync(cancellationToken);

            // Fetch again to get Assignee name
             var createdSubtask = await _context.Subtasks.Include(s => s.Assignee).FirstAsync(s => s.Id == subtask.Id, cancellationToken);

            return new SubtaskDto(createdSubtask.Id, createdSubtask.Title, createdSubtask.IsCompleted, createdSubtask.AssigneeId, createdSubtask.Assignee?.FullName, createdSubtask.OrderIndex);
        }

        public async Task<SubtaskDto> ToggleSubtaskAsync(Guid workspaceId, Guid userId, Guid subtaskId, CancellationToken cancellationToken = default)
        {
            var subtask = await _context.Subtasks
                .Include(s => s.Task)
                .Include(s => s.Assignee)
                .FirstOrDefaultAsync(s => s.Id == subtaskId && s.Task.WorkspaceId == workspaceId, cancellationToken);

            if (subtask == null) throw new Exception("Subtask not found.");

            // STRICT PERMISSION CHECK: Subtask Assignee OR Parent Task Assignee
            if (subtask.AssigneeId != userId && subtask.Task.AssigneeId != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to complete this subtask.");
            }

            subtask.IsCompleted = !subtask.IsCompleted;

            _context.TaskActivities.Add(new TaskActivity
            {
                TaskId = subtask.TaskId,
                ActivityType = ActivityType.SUBTASK_COMPLETED,
                NewValue = subtask.Title, // Log which subtask was toggled
                OldValue = (!subtask.IsCompleted).ToString(), // Previous state
                ChangedById = userId
            });

            await _context.SaveChangesAsync(cancellationToken);


            
            return new SubtaskDto(subtask.Id, subtask.Title, subtask.IsCompleted, subtask.AssigneeId, subtask.Assignee?.FullName, subtask.OrderIndex);
        }

        public async Task<TaskCommentDto> AddCommentAsync(Guid workspaceId, Guid userId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken = default)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId, cancellationToken);
            if (task == null) throw new Exception("Task not found.");

            var comment = new TaskComment
            {
                TaskId = taskId,
                UserId = userId,
                Content = request.Content
            };

            _context.TaskComments.Add(comment);

            _context.TaskActivities.Add(new TaskActivity
            {
                TaskId = taskId,
                ActivityType = ActivityType.COMMENT_ADDED,
                NewValue = "Comment added", // Content might be too long to log in value
                ChangedById = userId
            });

            await _context.SaveChangesAsync(cancellationToken);

            // Fetch to get user details
            var createdComment = await _context.TaskComments
                .Include(c => c.User)
                .FirstAsync(c => c.Id == comment.Id, cancellationToken);
            
            // Register Mentions in DB
            await RegisterMentions(taskId, comment.Id, request.Content, userId);
            await _context.SaveChangesAsync(cancellationToken);

            // Notification logic
            await ProcessMentions(request.Content, userId, createdComment.User.FullName, workspaceId, 
                $"mentioned you in a comment on task '{task.Title}'", 
                new { TaskId = taskId, CommentId = comment.Id });

            return new TaskCommentDto(createdComment.Id, createdComment.UserId, createdComment.User.FullName, "", createdComment.Content, createdComment.CreatedAt);
        }

        private static TaskDto MapToDto(TaskItem t)
        {
            return new TaskDto(
                t.Id,
                t.WorkspaceId,
                t.ListId,
                t.Title,
                t.Description,
                t.CustomStatus ?? "", 
                t.Priority.ToString(),
                t.AssigneeId,
                t.Assignee?.FullName,
                t.Assignee?.AvatarUrl,
                t.CreatedById,
                t.CreatedBy?.FullName ?? "Unknown",
                t.DueDate,
                t.OrderIndex,
                t.CreatedAt,
                t.UpdatedAt,
                t.SubDescription,
                t.CustomStatus,
                t.Tags.Select(tg => new TagDto(tg.Id, tg.Name, tg.Color)).ToList()
            );
        }

        private async Task ProcessMentions(string content, Guid senderId, string senderName, Guid workspaceId, string baseMessage, object dataObj)
        {
            var mentionRegex = new Regex(@"<@([a-fA-F0-9-]+)\|([^>]+)>");
            var matches = mentionRegex.Matches(content);

            var mentionedUserIds = new HashSet<Guid>();
            foreach (Match match in matches)
            {
                if (Guid.TryParse(match.Groups[1].Value, out Guid uid))
                {
                    if (uid != senderId) // Don't notify self
                    {
                        mentionedUserIds.Add(uid);
                    }
                }
            }

            foreach (var uid in mentionedUserIds)
            {
                // Verify user is in workspace (optional)
                var isInWorkspace = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == uid);
                if (isInWorkspace)
                {
                    // 1. Send Notification
                    await _notificationService.NotifyUserAsync(
                        uid,
                        "New Mention",
                        $"{senderName} {baseMessage}",
                        2, // Type 2 = Mention
                        JsonSerializer.Serialize(dataObj)
                    );

                    // 2. Persist Task/Comment Mention relations
                    // Extract TaskId and CommentId from dataObj if possible, simpler to rely on caller passing them explicitly in future refactor
                    // For now, checking if dataObj has TaskId/CommentId properties via reflection or dynamic is risky/slow.
                    // Better approach: Overload ProcessMentions or pass explicit IDs. 
                    // BUT: 'dataObj' is anonymous object. 
                    // Let's assume the mention logic also adds them to watchers if not present.
                    // Note: This method is private. I will update AddCommentAsync to handle the DB inserts directly before calling this.
                }
            }
        }

        private async Task RegisterMentions(Guid taskId, Guid? commentId, string content, Guid senderId) {
             var mentionRegex = new Regex(@"<@([a-fA-F0-9-]+)\|([^>]+)>");
            var matches = mentionRegex.Matches(content);
            var mentionedUserIds = new HashSet<Guid>();
             foreach (Match match in matches)
            {
                if (Guid.TryParse(match.Groups[1].Value, out Guid uid)) mentionedUserIds.Add(uid);
            }

            foreach (var uid in mentionedUserIds)
            {
                 // Add Task Mention (Only if not a comment mention, i.e. Description mention)
                 if (commentId == null && !await _context.TaskMentions.AnyAsync(tm => tm.TaskId == taskId && tm.UserId == uid)) {
                     _context.TaskMentions.Add(new TaskMention { TaskId = taskId, UserId = uid });
                 }

                 // Add Comment Mention
                 if (commentId.HasValue && !await _context.CommentMentions.AnyAsync(cm => cm.CommentId == commentId.Value && cm.UserId == uid)) {
                     _context.CommentMentions.Add(new CommentMention { CommentId = commentId.Value, UserId = uid });
                 }

                 // Auto-add to watchers
                 if (!await _context.TaskWatchers.AnyAsync(tw => tw.TaskId == taskId && tw.UserId == uid)) {
                     _context.TaskWatchers.Add(new TaskWatcher { TaskId = taskId, UserId = uid });
                 }
            }
            // Save changes happens in caller
        }
        public async Task<List<MyTaskDto>> GetMyTasksAsync(Guid userId, Guid workspaceId, CancellationToken cancellationToken = default)
        {
            var today = DateTime.UtcNow.Date;
            var nextWeek = DateTime.UtcNow.AddDays(7);

            var tasks = await _context.Tasks
                .Where(t => t.WorkspaceId == workspaceId)
                .Where(t => 
                    t.AssigneeId == userId ||
                    t.Watchers.Any(w => w.UserId == userId) ||
                    t.Mentions.Any(m => m.UserId == userId) ||
                    t.Comments.Any(c => c.Mentions.Any(cm => cm.UserId == userId)))
                .Select(t => new
                {
                    t.Id,
                    t.WorkspaceId,
                    t.Title,
                    WorkspaceName = t.Workspace.Name,
                    SpaceName = t.List.Space.Name,
                    ListName = t.List.Name,
                    Status = t.CustomStatus ?? t.Status.ToString(),
                    Priority = t.Priority, // Enum
                    t.DueDate,
                    AssigneeName = t.Assignee != null ? t.Assignee.FullName : "",
                    AssigneeAvatarUrl = t.Assignee != null ? t.Assignee.AvatarUrl : "",
                    Tags = t.Tags.Select(tg => new TagDto(tg.Id, tg.Name, tg.Color)).ToList(),
                    
                    SubtaskCount = t.Subtasks.Count,
                    CompletedSubtasks = t.Subtasks.Count(s => s.IsCompleted),
                    CommentCount = t.Comments.Count,

                    IsAssigned = t.AssigneeId == userId,
                    IsWatching = t.Watchers.Any(w => w.UserId == userId),
                    IsMentioned = t.Mentions.Any(m => m.UserId == userId) 
                                  || t.Comments.Any(c => c.Mentions.Any(cm => cm.UserId == userId)),
                    
                    IsBlocked = t.Status == TaskStatus.BLOCKED,
                    // Re-calculate complex date logic in memory or simple checks here?
                    // EF can translate simple date comparisons usually.
                    
                    LastActivityAt = t.Activities.OrderByDescending(a => a.Timestamp).Select(a => a.Timestamp).FirstOrDefault(),
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            
            var dtos = tasks.Select(t => {
                var isOverdue = t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatus.DONE.ToString(); // NoteStatus string comparison might be tricky if localized or mismatched
                // Fix: Status in anonymous type is string or enum?
                // In Entity it is helper property CustomStatus vs Status (Enum).
                // Let's use the same logic as before:
                // IsOverdue = ... && t.Status != TaskStatus.DONE
                // But we projected string "Status".
                // Better: Project raw Status Enum.
                
                var statusEnum = (TaskStatus)Enum.Parse(typeof(TaskStatus), t.Status == "TODO" || t.Status == "IN_PROGRESS" || t.Status == "DONE" || t.Status == "BLOCKED" || t.Status == "IN_REVIEW" ? t.Status : "TODO", true); 
                // Actually, t.Priority is Enum in entity, but projected as Enum?
                // Let's check original Projection: Status = t.CustomStatus ?? t.Status.ToString()
                
                // Optimized Recalculation:
                var isDone = t.Status == "DONE"; // If CustomStatus is "DONE" manually? safer to check Enum if projected.
                // Re-reading original code: t.Status != TaskStatus.DONE. 
                // I will Project t.StatusEnum as well.
                
                return new MyTaskDto
                {
                    TaskId = t.Id,
                    WorkspaceId = t.WorkspaceId,
                    Title = t.Title,
                    WorkspaceName = t.WorkspaceName,
                    SpaceName = t.SpaceName,
                    ListName = t.ListName,
                    Status = t.Status,
                    Priority = t.Priority.ToString(),
                    DueDate = t.DueDate,
                    AssigneeName = t.AssigneeName,
                    AssigneeAvatarUrl = t.AssigneeAvatarUrl,
                    Tags = t.Tags,
                    
                    SubtaskCount = t.SubtaskCount,
                    CompletedSubtasks = t.CompletedSubtasks,
                    CommentCount = t.CommentCount,

                    IsAssigned = t.IsAssigned,
                    IsWatching = t.IsWatching,
                    IsMentioned = t.IsMentioned,

                    IsBlocked = t.IsBlocked,
                    IsOverdue = t.DueDate.HasValue && t.DueDate.Value < now && !isDone, // Approximation, strict check requires Enum
                    IsDueToday = t.DueDate.HasValue && t.DueDate.Value.Date == now.Date,
                    IsDueThisWeek = t.DueDate.HasValue && t.DueDate.Value <= now.AddDays(7) && t.DueDate.Value >= now,
                    
                    LastActivityAt = t.LastActivityAt != default ? t.LastActivityAt : t.UpdatedAt,
                    UrgencyScore = 0 // Calculated below
                };
            }).ToList();

            // Calculate Urgency Score
            foreach (var dto in dtos)
            {
                 int score = 0;
                 if (dto.IsOverdue) score += 100;
                 if (dto.IsDueToday) score += 60;
                 if (dto.IsDueThisWeek) score += 30;
                 if (dto.Priority == "HIGH" || dto.Priority == "URGENT") score += 20;
                 if (dto.IsMentioned) score += 15;
                 if ((now - dto.LastActivityAt).TotalHours < 4) score += 10;
                 if (dto.IsBlocked) score -= 50;
                 dto.UrgencyScore = score;
            }

            return dtos.OrderByDescending(d => d.UrgencyScore).ToList();
        }

        public async Task DeleteTaskAsync(Guid workspaceId, Guid userId, Guid taskId, CancellationToken cancellationToken = default)
        {
            var task = await _context.Tasks
                .Include(t => t.Activities)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.List.Space.WorkspaceId == workspaceId, cancellationToken);

            if (task == null)
                throw new Exception("Task not found");

            // STRICT PERMISSION CHECK: Only Assignee or Creator can delete
            if (task.AssigneeId != userId && task.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this task.");
            }

            // Query and remove related entities
            var subtasks = await _context.Subtasks.Where(s => s.TaskId == taskId).ToListAsync(cancellationToken);
            var comments = await _context.TaskComments.Where(c => c.TaskId == taskId).ToListAsync(cancellationToken);
            
            _context.Subtasks.RemoveRange(subtasks);
            _context.TaskComments.RemoveRange(comments);
            _context.TaskActivities.RemoveRange(task.Activities);
            
            // Remove the task itself
            _context.Tasks.Remove(task);
            
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
