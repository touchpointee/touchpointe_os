using System;
using Touchpointe.Domain.Common;

namespace Touchpointe.Domain.Entities
{
    public class DealComment : BaseAuditableEntity, ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        // Id inherited from BaseAuditableEntity

        public Guid DealId { get; set; }
        public Deal Deal { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string Content { get; set; } = string.Empty;
        // CreatedAt inherited from BaseAuditableEntity

        public ICollection<DealCommentMention> Mentions { get; set; } = new List<DealCommentMention>();
    }

    public class DealCommentMention : ISoftDelete
    {
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid CommentId { get; set; }
        public DealComment Comment { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public int StartIndex { get; set; }
        public int Length { get; set; }
    }
}
