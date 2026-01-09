using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public class DirectMessageGroup
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<DirectMessageMember> Members { get; set; } = new List<DirectMessageMember>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class DirectMessageMember
    {
        public Guid Id { get; set; }
        public Guid DirectMessageGroupId { get; set; }
        public Guid UserId { get; set; }
        
        // Navigation
        public DirectMessageGroup Group { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
