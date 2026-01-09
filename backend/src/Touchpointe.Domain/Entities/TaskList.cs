using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public class TaskList
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid SpaceId { get; set; }
        public Space Space { get; set; } = null!;

        // Optional folder grouping
        public Guid? FolderId { get; set; }
        public Folder? Folder { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public int OrderIndex { get; set; }

        // JSONB in DB, represented as string here for simplicity
        public string? StatusConfig { get; set; } 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
