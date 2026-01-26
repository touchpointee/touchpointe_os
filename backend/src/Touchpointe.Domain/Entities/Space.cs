using System;
using System.ComponentModel.DataAnnotations;

using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class Space : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited from BaseAuditableEntity

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Icon { get; set; }

        public int OrderIndex { get; set; }

        // CreatedAt inherited from BaseAuditableEntity

        // Navigation
        public ICollection<Folder> Folders { get; set; } = new List<Folder>();
        public ICollection<TaskList> Lists { get; set; } = new List<TaskList>();
    }
}
