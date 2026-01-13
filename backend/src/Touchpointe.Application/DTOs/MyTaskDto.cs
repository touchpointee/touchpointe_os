using System;

namespace Touchpointe.Application.DTOs
{
    public class MyTaskDto
    {
        public Guid TaskId { get; set; }
        public Guid WorkspaceId { get; set; }
        
        public string Title { get; set; } = string.Empty;
        public string WorkspaceName { get; set; } = string.Empty;
        public string SpaceName { get; set; } = string.Empty;
        public string ListName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public DateTime LastActivityAt { get; set; }
        
        public string AssigneeName { get; set; } = string.Empty;
        public string AssigneeAvatarUrl { get; set; } = string.Empty;

        public int SubtaskCount { get; set; }
        public int CompletedSubtasks { get; set; }
        public int CommentCount { get; set; }

        public bool IsAssigned { get; set; }
        public bool IsWatching { get; set; }
        public bool IsMentioned { get; set; }
        
        // Smart Properties
        public bool IsOverdue { get; set; }
        public bool IsDueToday { get; set; }
        public bool IsDueThisWeek { get; set; }
        public bool IsBlocked { get; set; }

        public int UrgencyScore { get; set; }
    }
}
