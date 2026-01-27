using System;
using System.ComponentModel.DataAnnotations;
using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class MessageAttachment : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited

        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid WorkspaceId { get; set; }
        // Optional: Navigation to Workspace if needed, but Message has it.
        
        [Required]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public string FileUrl { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;
        
        public long Size { get; set; }
        
        // CreatedAt inherited
    }
}
