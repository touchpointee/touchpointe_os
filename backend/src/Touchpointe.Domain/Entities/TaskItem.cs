using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum TaskStatus
    {
        TODO,
        IN_PROGRESS,
        IN_REVIEW,
        DONE,
        BLOCKED
    }

    public enum TaskPriority
    {
        NONE,
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }

    public class TaskItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid ListId { get; set; }
        public TaskList List { get; set; } = null!;

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        
        public string? SubDescription { get; set; }

        public TaskStatus Status { get; set; } = TaskStatus.TODO; // Acts as Category (TODO, ACTIVE, DONE)

        public string? CustomStatus { get; set; } // The actual status name (e.g. "Ready for QA")

        public TaskPriority Priority { get; set; } = TaskPriority.NONE;

        // OPTIONAL: Task may not have an assignee
        public Guid? AssigneeId { get; set; }
        public User? Assignee { get; set; }

        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        public DateTime? DueDate { get; set; }

        public int OrderIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>();
        public ICollection<TaskWatcher> Watchers { get; set; } = new List<TaskWatcher>();
        public ICollection<TaskMention> Mentions { get; set; } = new List<TaskMention>();
        public ICollection<Tag> Tags { get; set; } = new List<Tag>();
        public ICollection<TaskTimeEntry> TimeEntries { get; set; } = new List<TaskTimeEntry>();
    }
}
