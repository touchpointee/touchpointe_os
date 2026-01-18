using System;

namespace Touchpointe.Application.DTOs
{
    public enum MentionType
    {
        TASK,
        COMMENT,
        CHAT
    }

    public class UserMentionDto
    {
        public MentionType Type { get; set; }
        public Guid WorkspaceId { get; set; }
        public DateTime CreatedAt { get; set; }

        // Content
        public string PreviewText { get; set; } = string.Empty;

        // Context IDs
        public Guid? TaskId { get; set; }
        public Guid? ChannelId { get; set; }
        public Guid? DmGroupId { get; set; }
        public Guid? MessageId { get; set; }

        // Actor (Who mentioned)
        public string ActorName { get; set; } = string.Empty;
        public string? ActorAvatar { get; set; }

        // Additional Context
        public string? TaskTitle { get; set; }
        public string? ChannelName { get; set; }

        public string SubType { get; set; } = "mention"; // "mention", "reply", "reaction"
        public string? Info { get; set; } // e.g. emoji
    }
}
