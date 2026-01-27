using System;

namespace Touchpointe.Application.DTOs
{
    public class DealCommentDto
    {
        public Guid Id { get; set; }
        public Guid DealId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserAvatarUrl { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
