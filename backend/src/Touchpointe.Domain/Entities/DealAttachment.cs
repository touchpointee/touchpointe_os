using Touchpointe.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public class DealAttachment : ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid DealId { get; set; }
        public Deal Deal { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        [Required]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public string StoredFileName { get; set; } = string.Empty; // Minio Object Name

        public string ContentType { get; set; } = string.Empty;

        public long Size { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
