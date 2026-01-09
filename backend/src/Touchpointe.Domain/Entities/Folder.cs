using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public class Folder
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid SpaceId { get; set; }
        public Space Space { get; set; } = null!;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Icon { get; set; }

        public int OrderIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<TaskList> Lists { get; set; } = new List<TaskList>();
    }
}
