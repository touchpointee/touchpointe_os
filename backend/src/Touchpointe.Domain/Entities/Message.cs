using System;

using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class Message : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited from BaseAuditableEntity
        public Guid WorkspaceId { get; set; }
        
        public Guid? ChannelId { get; set; }
        public Guid? DirectMessageGroupId { get; set; }
        
        public Guid SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        // CreatedAt inherited from BaseAuditableEntity

        // Snapshot-based Reply
        public Guid? ReplyToMessageId { get; set; }
        public string? ReplyPreviewSenderName { get; set; }
        public string? ReplyPreviewText { get; set; }

        // Navigation properties
        public Channel? Channel { get; set; }
        public DirectMessageGroup? DirectMessageGroup { get; set; }
        public User Sender { get; set; } = null!;
        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
        public ICollection<ChatMention> Mentions { get; set; } = new List<ChatMention>();
    }
}
