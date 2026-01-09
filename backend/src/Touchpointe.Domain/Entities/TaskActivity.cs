using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum ActivityType
    {
        CREATED,
        STATUS_CHANGED,
        PRIORITY_CHANGED,
        ASSIGNEE_CHANGED,
        DUE_DATE_CHANGED,
        TITLE_CHANGED,
        DESCRIPTION_CHANGED,
        COMMENT_ADDED,
        SUBTASK_ADDED,
        SUBTASK_COMPLETED,
        SUBTASK_DELETED
    }

    public class TaskActivity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public ActivityType ActivityType { get; set; }

        public string? OldValue { get; set; }
        public string? NewValue { get; set; }

        public Guid ChangedById { get; set; }
        public User ChangedBy { get; set; } = null!;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
