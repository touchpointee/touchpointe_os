using System;

namespace Touchpointe.Domain.Entities
{
    public class ChannelMember
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public Guid ChannelId { get; set; }
        public Guid UserId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public Guid? LastReadMessageId { get; set; }

        // Navigation properties
        public Channel Channel { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
