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

        public async Task<List<TaskDto>> GetTasksByListAsync(Guid workspaceId, Guid listId)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Where(t => t.WorkspaceId == workspaceId && t.ListId == listId)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync();

            return tasks.Select(MapToDto).ToList();
        }

        public async Task<TaskDto> CreateTaskAsync(Guid workspaceId, Guid userId, CreateTaskRequest request)
        {
            // Validate Assignee is in Workspace
            var isMember = await _context.WorkspaceMembers
                .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId);

            if (!isMember)
            {
                throw new Exception("Assignee is not a member of this workspace.");
            }

            // Get Max Order
            var maxOrder = await _context.Tasks
                .Where(t => t.ListId == request.ListId)
                .MaxAsync(t => (int?)t.OrderIndex) ?? 0;

            // Convert DueDate to UTC if present (PostgreSQL requires UTC)
            DateTime? dueDateUtc = request.DueDate.HasValue 
                ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc)
                : null;

            var task = new TaskItem
            {
                WorkspaceId = workspaceId,
                ListId = request.ListId,
                Title = request.Title,
                Description = request.Description,
                SubDescription = request.SubDescription,
                Status = TaskStatus.TODO,
                Priority = (TaskPriority)request.Priority,
                AssigneeId = request.AssigneeId,
                CreatedById = userId,
                DueDate = dueDateUtc,
                OrderIndex = maxOrder + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }; 

            _context.Tasks.Add(task);
            
            // Log Activity
            var activity = new TaskActivity
            {
                TaskId = task.Id,
                ActivityType = ActivityType.CREATED,
                ChangedById = userId,
                NewValue = task.Title,
                Timestamp = DateTime.UtcNow
            };
            _context.TaskActivities.Add(activity);

            _context.TaskActivities.Add(activity);

            // Auto-watch: Creator and Assignee
            if (userId != request.AssigneeId)
            {
                _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = userId });
            }
            _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = request.AssigneeId });

            await _context.SaveChangesAsync(CancellationToken.None);

            // Fetch again to include navigation props
            var createdTask = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .FirstAsync(t => t.Id == task.Id);

            return MapToDto(createdTask);
        }

        public async Task<TaskDto> UpdateTaskAsync(Guid workspaceId, Guid userId, Guid taskId, UpdateTaskRequest request)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId);

            if (task == null) throw new Exception("Task not found.");
            
            // STRICT PERMISSION CHECK: Only Assignee or Creator can edit
            if (task.AssigneeId != userId && task.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to edit this task.");
            }

            // Log changes
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

            if (request.AssigneeId.HasValue && task.AssigneeId != request.AssigneeId.Value)
            {
                // Validate new assignee
                var isMember = await _context.WorkspaceMembers
                    .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId.Value);
                if (!isMember) throw new Exception("New assignee is not a member of this workspace.");

                _context.TaskActivities.Add(new TaskActivity
                {
                    TaskId = task.Id,
                    ActivityType = ActivityType.ASSIGNEE_CHANGED,
                    OldValue = task.AssigneeId.ToString(),
                    NewValue = request.AssigneeId.Value.ToString(),
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.AssigneeId = request.AssigneeId.Value;

                // Auto-watch new Assignee
                var alreadyWatcher = await _context.TaskWatchers.AnyAsync(w => w.TaskId == task.Id && w.UserId == request.AssigneeId.Value);
                if (!alreadyWatcher)
                {
                    _context.TaskWatchers.Add(new TaskWatcher { TaskId = task.Id, UserId = request.AssigneeId.Value });
                }
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
                 // Typically don't log description changes or store full text, but tracking the event
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
                    ActivityType = ActivityType.DESCRIPTION_CHANGED, // Reusing existing type
                    ChangedById = userId,
                    Timestamp = DateTime.UtcNow
                });
                task.SubDescription = request.SubDescription;
            }
            
            if (request.DueDate != task.DueDate)
            {
                // Convert to UTC for PostgreSQL
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

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(task);
        }

        public async Task<List<TaskActivityDto>> GetTaskActivitiesAsync(Guid workspaceId, Guid taskId)
        {
             var activities = await _context.TaskActivities
                .Include(a => a.ChangedBy)
                .Where(a => a.TaskId == taskId) // Workspace check implicit via Task existence, but could be safer
                .Where(a => a.Task.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

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

        public async Task<TaskDetailDto> GetTaskDetailsAsync(Guid workspaceId, Guid taskId)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId);

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
                .ToListAsync();

            var comments = await _context.TaskComments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TaskCommentDto(c.Id, c.UserId, c.User.FullName, "", c.Content, c.CreatedAt))
                .ToListAsync();

            var activities = await GetTaskActivitiesAsync(workspaceId, taskId);

            return new TaskDetailDto(MapToDto(task), subtasks, comments, activities);
        }

        public async Task<SubtaskDto> AddSubtaskAsync(Guid workspaceId, Guid userId, Guid taskId, CreateSubtaskRequest request)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId);
            if (task == null) throw new Exception("Task not found.");

            // STRICT PERMISSION CHECK: Only Main Task Owner can add subtasks
            if (task.AssigneeId != userId && task.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("Only the task owner can add subtasks.");
            }

            // Validate Assignee
             var isMember = await _context.WorkspaceMembers
                .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == request.AssigneeId);
            
            if (!isMember) throw new Exception("Assignee is not a member of this workspace.");

            var maxOrder = await _context.Subtasks
                .Where(s => s.TaskId == taskId)
                .MaxAsync(s => (int?)s.OrderIndex) ?? 0;

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

            await _context.SaveChangesAsync(CancellationToken.None);

            // Fetch again to get Assignee name
             var createdSubtask = await _context.Subtasks.Include(s => s.Assignee).FirstAsync(s => s.Id == subtask.Id);

            return new SubtaskDto(createdSubtask.Id, createdSubtask.Title, createdSubtask.IsCompleted, createdSubtask.AssigneeId, createdSubtask.Assignee.FullName, createdSubtask.OrderIndex);
        }

        public async Task<SubtaskDto> ToggleSubtaskAsync(Guid workspaceId, Guid userId, Guid subtaskId)
        {
            var subtask = await _context.Subtasks
                .Include(s => s.Task)
                .Include(s => s.Assignee)
                .FirstOrDefaultAsync(s => s.Id == subtaskId && s.Task.WorkspaceId == workspaceId);

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

            await _context.SaveChangesAsync(CancellationToken.None);


            
            return new SubtaskDto(subtask.Id, subtask.Title, subtask.IsCompleted, subtask.AssigneeId, subtask.Assignee.FullName, subtask.OrderIndex);
        }

        public async Task<TaskCommentDto> AddCommentAsync(Guid workspaceId, Guid userId, Guid taskId, CreateCommentRequest request)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId);
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

            await _context.SaveChangesAsync(CancellationToken.None);

            // Fetch to get user details
            var createdComment = await _context.TaskComments
                .Include(c => c.User)
                .FirstAsync(c => c.Id == comment.Id);
            
            // Register Mentions in DB
            await RegisterMentions(taskId, comment.Id, request.Content, userId);
            await _context.SaveChangesAsync(CancellationToken.None);

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
                t.Status.ToString(),
                t.Priority.ToString(),
                t.AssigneeId,
                t.Assignee != null ? t.Assignee.FullName : "",
                null, // Avatar
                t.CreatedById,
                t.CreatedBy != null ? t.CreatedBy.FullName : "",
                t.DueDate,
                t.OrderIndex,
                t.CreatedAt,
                t.UpdatedAt,
                t.SubDescription
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
        public async Task<List<MyTaskDto>> GetMyTasksAsync(Guid userId, Guid workspaceId)
        {
            // 1. Verify User is in Workspace
            var isMember = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);
            if (!isMember) return new List<MyTaskDto>(); // Or throw Unauthorized

            // 2. Fetch Tasks where User is Involved
            // Using a broad fetch to allow client-side or memory calculation of complex flags
            // Optimized to fetch valid candidates first
            var taskQuery = _context.Tasks
                .Include(t => t.Workspace)
                .Include(t => t.List).ThenInclude(l => l.Space)
                .Include(t => t.Assignee)
                .Include(t => t.Watchers)
                .Include(t => t.Mentions)
                .Include(t => t.Activities) // For LastActivity
                // .Include(t => t.Subtasks) // If we need subtask counts, handled via Select/Count usually better
                .Where(t => t.WorkspaceId == workspaceId)
                .Where(t => 
                    t.AssigneeId == userId ||
                    t.Watchers.Any(w => w.UserId == userId) ||
                    t.Mentions.Any(m => m.UserId == userId) 
                    // Note: Comment mentions are trickier. 
                    // Ideally, we'd add '|| t.Comments.Any(c => c.Mentions.Any(cm => cm.UserId == userId))'
                    // but for performance, let's include it if indexed efficiently.
                    || _context.TaskComments.Any(c => c.TaskId == t.Id && c.Mentions.Any(cm => cm.UserId == userId))
                );

            var tasks = await taskQuery.ToListAsync();

            // 3. Project to DTO and Calculate Scores in Memory
            var dtos = new List<MyTaskDto>();
            var now = DateTime.UtcNow;

            foreach (var t in tasks)
            {
                var dto = new MyTaskDto
                {
                    TaskId = t.Id,
                    WorkspaceId = t.WorkspaceId,
                    Title = t.Title,
                    WorkspaceName = t.Workspace?.Name ?? "",
                    SpaceName = t.List?.Space?.Name ?? "",
                    ListName = t.List?.Name ?? "",
                    Status = t.Status.ToString(),
                    Priority = t.Priority.ToString(),
                    DueDate = t.DueDate,
                    AssigneeName = t.Assignee?.FullName ?? "",
                    AssigneeAvatarUrl = t.Assignee?.AvatarUrl ?? "",
                    
                    SubtaskCount = await _context.Subtasks.CountAsync(s => s.TaskId == t.Id), // Consider optimizing to GroupBy
                    CompletedSubtasks = await _context.Subtasks.CountAsync(s => s.TaskId == t.Id && s.IsCompleted),
                    CommentCount = await _context.TaskComments.CountAsync(c => c.TaskId == t.Id),

                    IsAssigned = t.AssigneeId == userId,
                    IsWatching = t.Watchers.Any(w => w.UserId == userId),
                    IsMentioned = t.Mentions.Any(m => m.UserId == userId) 
                                  || await _context.TaskComments.AnyAsync(c => c.TaskId == t.Id && c.Mentions.Any(cm => cm.UserId == userId)), // Refined check

                    IsBlocked = t.Status == TaskStatus.BLOCKED,
                    IsOverdue = t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatus.DONE,
                    IsDueToday = t.DueDate.HasValue && t.DueDate.Value.Date == now.Date,
                    IsDueThisWeek = t.DueDate.HasValue && t.DueDate.Value <= now.AddDays(7) && t.DueDate.Value >= now,
                    
                    LastActivityAt = t.Activities.OrderByDescending(a => a.Timestamp).Select(a => a.Timestamp).FirstOrDefault()
                };

                if (dto.LastActivityAt == default) dto.LastActivityAt = t.UpdatedAt;

                // 4. Calculate Urgency Score
                int score = 0;
                if (dto.IsOverdue) score += 100;
                if (dto.IsDueToday) score += 60;
                if (dto.IsDueThisWeek) score += 30;
                if (t.Priority == TaskPriority.HIGH || t.Priority == TaskPriority.URGENT) score += 20;
                if (dto.IsMentioned) score += 15;
                if ((now - dto.LastActivityAt).TotalHours < 4) score += 10; // Recently updated (4h window)
                if (dto.IsBlocked) score -= 50;

                dto.UrgencyScore = score;
                dtos.Add(dto);
            }

            return dtos.OrderByDescending(d => d.UrgencyScore).ToList();
        }

        public async Task DeleteTaskAsync(Guid workspaceId, Guid userId, Guid taskId)
        {
            var task = await _context.Tasks
                .Include(t => t.Activities)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.List.Space.WorkspaceId == workspaceId);

            if (task == null)
                throw new Exception("Task not found");

            // Query and remove related entities
            var subtasks = await _context.Subtasks.Where(s => s.TaskId == taskId).ToListAsync();
            var comments = await _context.TaskComments.Where(c => c.TaskId == taskId).ToListAsync();
            
            _context.Subtasks.RemoveRange(subtasks);
            _context.TaskComments.RemoveRange(comments);
            _context.TaskActivities.RemoveRange(task.Activities);
            
            // Remove the task itself
            _context.Tasks.Remove(task);
            
            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}
