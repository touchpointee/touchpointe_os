using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Common
{
    public abstract class BaseAuditableEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Guid? CreatedById { get; set; }
        
        public DateTime? LastModifiedAt { get; set; }
        
        public Guid? LastModifiedById { get; set; }
    }
}
