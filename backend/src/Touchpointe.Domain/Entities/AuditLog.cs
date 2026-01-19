using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid? WorkspaceId { get; set; }
        
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string ActorRole { get; set; } = string.Empty;

        [MaxLength(100)]
        public string TargetId { get; set; } = string.Empty; // Store as string for flexibility (Guid or other ID)
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public string IpAddress { get; set; } = string.Empty;
        
        public string? Metadata { get; set; } // JSON string
    }
}
