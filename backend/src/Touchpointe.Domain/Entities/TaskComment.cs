using System;

using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class TaskComment : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
    }
}
