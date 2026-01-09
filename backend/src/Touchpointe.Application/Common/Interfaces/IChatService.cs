using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IChatService
    {
        // Channels
        Task<List<ChannelDto>> GetChannelsAsync(Guid workspaceId, Guid userId);
        Task<ChannelDto> CreateChannelAsync(Guid workspaceId, Guid userId, CreateChannelRequest request);
        Task<bool> JoinChannelAsync(Guid workspaceId, Guid channelId, Guid userId);
        Task<bool> LeaveChannelAsync(Guid workspaceId, Guid channelId, Guid userId);

        // Messages
        Task<List<MessageDto>> GetChannelMessagesAsync(Guid workspaceId, Guid channelId, Guid userId, int take = 50);
        Task<MessageDto> PostChannelMessageAsync(Guid workspaceId, Guid channelId, Guid userId, PostMessageRequest request);
        
        // Direct Messages
        Task<List<DmGroupDto>> GetUserDmGroupsAsync(Guid workspaceId, Guid userId);
        Task<DmGroupDto> GetOrCreateDmGroupAsync(Guid workspaceId, Guid currentUserId, CreateDmRequest request);
        Task<List<MessageDto>> GetDmMessagesAsync(Guid workspaceId, Guid dmGroupId, Guid userId, int take = 50);
        Task<MessageDto> PostDmMessageAsync(Guid workspaceId, Guid dmGroupId, Guid userId, PostMessageRequest request);
        
        // Members (for DM picker)
        Task<List<UserDto>> GetWorkspaceMembersAsync(Guid workspaceId);
    }
}
