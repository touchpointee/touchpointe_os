using System;
using System.ComponentModel.DataAnnotations;

using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class TaskList : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited from BaseAuditableEntity

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

        // CreatedAt inherited from BaseAuditableEntity
    }
}
