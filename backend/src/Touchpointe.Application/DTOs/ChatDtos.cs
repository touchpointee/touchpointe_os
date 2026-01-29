using System;
using System.Collections.Generic;

namespace Touchpointe.Application.DTOs
{
    public record ChannelDto(Guid Id, Guid WorkspaceId, string Name, bool IsPrivate, string Description, int MemberCount);
    
    public record CreateChannelRequest(string Name, bool IsPrivate, string Description);
    public record UpdateChannelRequest(string Name, string Description, bool IsPrivate);

    public record MessageDto(
        Guid Id, 
        Guid WorkspaceId, 
        Guid? ChannelId, 
        Guid? DirectMessageGroupId, 
        Guid SenderId, 
        string SenderName, 
        string? SenderAvatarUrl,
        string Content, 
        DateTime CreatedAt,
        List<MessageReactionDto> Reactions,
        List<MessageAttachmentDto> Attachments,
        Guid? ReplyToMessageId = null,
        string? ReplyPreviewSenderName = null,
        string? ReplyPreviewText = null
    );

    public record MessageAttachmentDto(Guid Id, string FileName, string FileUrl, string ContentType, long Size);
    public record MessageReactionDto(Guid Id, Guid MessageId, Guid UserId, string UserName, string Emoji, DateTime CreatedAt);
    public record AddReactionRequest(string Emoji);
    public record MarkReadRequest(Guid MessageId);

    public record AttachmentRequest(string FileName, string FileUrl, string ContentType, long Size);
    public record PostMessageRequest(string Content, Guid? ReplyToMessageId = null, List<AttachmentRequest>? Attachments = null);

    public record DmGroupDto(Guid Id, Guid WorkspaceId, List<UserDto> Members);
    
    // Simple UserDto for DM members list if not already existing
    public record UserDto(Guid Id, string FullName, string Email, string? AvatarUrl);

    public record CreateDmRequest(List<Guid> UserIds);
}
