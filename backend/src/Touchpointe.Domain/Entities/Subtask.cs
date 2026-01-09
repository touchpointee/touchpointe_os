using System;

namespace Touchpointe.Domain.Entities
{
    public class Subtask
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        
        public Guid AssigneeId { get; set; }
        public User Assignee { get; set; } = null!;

        public int OrderIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
