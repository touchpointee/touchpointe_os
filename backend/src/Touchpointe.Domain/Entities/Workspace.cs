using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public class Workspace
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Slug { get; set; } = string.Empty; // Unique
        
        public Guid OwnerId { get; set; }
        public User Owner { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
