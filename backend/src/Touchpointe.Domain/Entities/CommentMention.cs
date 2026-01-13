using System;

namespace Touchpointe.Domain.Entities
{
    public class CommentMention
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid CommentId { get; set; }
        public TaskComment Comment { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
