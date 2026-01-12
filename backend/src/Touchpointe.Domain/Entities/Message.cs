using System;

namespace Touchpointe.Domain.Entities
{
    public class Message
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        
        public Guid? ChannelId { get; set; }
        public Guid? DirectMessageGroupId { get; set; }
        
        public Guid SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Channel? Channel { get; set; }
        public DirectMessageGroup? DirectMessageGroup { get; set; }
        public User Sender { get; set; } = null!;
        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    }
}
