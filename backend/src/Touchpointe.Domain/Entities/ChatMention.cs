using System;

namespace Touchpointe.Domain.Entities
{
    public class ChatMention
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // New Fields for Reaction/Reply support
        public string Type { get; set; } = "mention"; // "mention", "reply", "reaction"
        public string? Info { get; set; } // e.g. Emoji

        public Guid? SourceUserId { get; set; }
        public User? SourceUser { get; set; }
    }
}
