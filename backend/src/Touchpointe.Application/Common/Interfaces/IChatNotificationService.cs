using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces;

public interface IChatNotificationService
{
    Task NotifyMessageAsync(string channelId, MessageDto message);
    Task NotifyTypingAsync(string channelId, string userId, string userName);
    Task NotifyStopTypingAsync(string channelId, string userId);
    Task NotifyUserOnlineAsync(string workspaceId, string userId);
    Task NotifyUserOfflineAsync(string workspaceId, string userId);
    Task NotifyReactionAddedAsync(string channelId, MessageReactionDto reaction);
    Task NotifyReactionRemovedAsync(string channelId, Guid messageId, Guid userId, string emoji);
    Task NotifyReadReceiptAsync(string channelId, Guid userId, Guid messageId);
    Task NotifyNotificationAsync(Guid userId, string title, string message, int type, string data);
}
