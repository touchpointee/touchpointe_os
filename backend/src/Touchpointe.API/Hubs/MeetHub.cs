using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.API.Hubs
{
    [Authorize]
    public class MeetHub : Hub
    {
        // Clients connect to "workspace-{id}" group to listen for meeting updates
        
        public async Task JoinWorkspace(string workspaceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace-{workspaceId}");
        }

        public async Task LeaveWorkspace(string workspaceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace-{workspaceId}");
        }
        
        // This Hub is mostly for SERVER -> CLIENT updates (Broadcasts).
        // Clients calling methods here is rare for this use case, 
        // as most logic is HTTP -> Controller -> Hub.
    }
}
