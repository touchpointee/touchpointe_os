using System;

namespace Touchpointe.Domain.Entities
{
    public class TaskTimeEntry
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkspaceId { get; set; }
        // No navigation property needed for Workspace usually if accessing via Task, but good for direct queries
        
        public Guid TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public int DurationSeconds { get; set; }

        public string? Description { get; set; }
        
        public bool IsManual { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
