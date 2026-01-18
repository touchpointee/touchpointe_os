using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum StatusCategory
    {
        NotStarted = 0,
        Active = 1,
        Closed = 2
    }

    /// <summary>
    /// Represents a status column for a TaskList (e.g., "To Do", "In Progress", "Done").
    /// Named ListStatus to avoid conflict with System.Threading.Tasks.TaskStatus.
    /// </summary>
    public class ListStatus
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ListId { get; set; }
        public TaskList List { get; set; } = null!;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Color { get; set; } = "#6B7280"; // NOT nullable, always persisted

        public StatusCategory Category { get; set; } = StatusCategory.NotStarted;

        public int Order { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
