using Microsoft.AspNetCore.SignalR;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Api.Hubs;
using System.Threading.Tasks;

namespace Touchpointe.Api.Services;

public class ChatNotificationService : IChatNotificationService
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatNotificationService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyMessageAsync(string channelId, MessageDto message)
    {
        // "channel:{id}" group used in Hub
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("message:new", message);
    }

    public async Task NotifyTypingAsync(string channelId, string userId, string userName)
    {
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("user:typing", new { userId, userName, channelId });
    }

    public async Task NotifyStopTypingAsync(string channelId, string userId)
    {
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("user:stopTyping", new { userId, channelId });
    }

    public async Task NotifyUserOnlineAsync(string workspaceId, string userId)
    {
        await _hubContext.Clients.Group($"workspace:{workspaceId}").SendAsync("user:online", userId);
    }

    public async Task NotifyUserOfflineAsync(string workspaceId, string userId)
    {
        await _hubContext.Clients.Group($"workspace:{workspaceId}").SendAsync("user:offline", userId);
    }

    public async Task NotifyReactionAddedAsync(string channelId, MessageReactionDto reaction)
    {
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("message:reaction:new", reaction);
    }

    public async Task NotifyReactionRemovedAsync(string channelId, Guid messageId, Guid userId, string emoji)
    {
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("message:reaction:remove", new { messageId, userId, emoji });
    }

    public async Task NotifyReadReceiptAsync(string channelId, Guid userId, Guid messageId)
    {
        await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("message:read", new { userId, messageId, channelId });
    }
}
