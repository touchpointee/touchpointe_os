using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace Touchpointe.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    // Maps UserID to List of ConnectionIDs (since user can have multiple tabs/devices)
    // NOTE: In production with multiple server instances, use Redis backplane. 
    // For single server, static dict is fine.
    private static readonly ConcurrentDictionary<string, UserConnection> OnlineUsers = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var workspaceId = Context.GetHttpContext()?.Request.Query["workspaceId"].ToString();
        if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(workspaceId))
        {
            // 1. Add to Workspace Group (for presence broadcast)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
            
            // 2. Track Online Status
            OnlineUsers.AddOrUpdate(userId, 
                new UserConnection { WorkspaceId = workspaceId, ConnectionIds = new HashSet<string> { Context.ConnectionId } },
                (key, existing) => {
                    existing.ConnectionIds.Add(Context.ConnectionId);
                    return existing;
                });

            // 3. Notify others in workspace: "User X is Online"
            await Clients.Group($"workspace:{workspaceId}").SendAsync("user:online", userId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            if (OnlineUsers.TryGetValue(userId, out var userConnection))
            {
                userConnection.ConnectionIds.Remove(Context.ConnectionId);
                
                // If no connections left, user is offline
                if (userConnection.ConnectionIds.Count == 0)
                {
                    OnlineUsers.TryRemove(userId, out _);
                    await Clients.Group($"workspace:{userConnection.WorkspaceId}").SendAsync("user:offline", userId);
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Called from Frontend when user switches channels
    public async Task JoinChannel(string channelId)
    {
        // Validation: Verify channel belongs to user's workspace? 
        // For MVP, we trust the Authorization token puts them in a valid context, 
        // but robust apps should check DB.
        
        // Remove from previous channels if needed? SignalR allows multiple groups.
        // We probably just want to listen to this specific channel group.
        await Groups.AddToGroupAsync(Context.ConnectionId, $"channel:{channelId}");
    }

    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel:{channelId}");
    }

    public async Task Typing(string channelId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value 
            ?? Context.User?.FindFirst("name")?.Value 
            ?? Context.User?.FindFirst(ClaimTypes.GivenName)?.Value
            ?? "Unknown User";
        
        if (userId != null)
        {
            // Broadcast to everyone else in channel
            await Clients.OthersInGroup($"channel:{channelId}").SendAsync("user:typing", new { userId, userName, channelId });
        }
    }

    public async Task StopTyping(string channelId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Clients.OthersInGroup($"channel:{channelId}").SendAsync("user:stopTyping", new { userId, channelId });
        }
    }
}

public class UserConnection
{
    public string WorkspaceId { get; set; } = string.Empty;
    public HashSet<string> ConnectionIds { get; set; } = new();
}
