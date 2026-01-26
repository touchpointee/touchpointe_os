using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class Tag : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited from BaseAuditableEntity

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Color { get; set; } = "#6B7280"; // Default gray

        // CreatedAt inherited from BaseAuditableEntity

        // Navigation
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
