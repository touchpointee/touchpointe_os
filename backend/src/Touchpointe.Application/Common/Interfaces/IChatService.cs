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
        Task<ChannelDto> UpdateChannelAsync(Guid workspaceId, Guid channelId, Guid userId, UpdateChannelRequest request);
        Task DeleteChannelAsync(Guid workspaceId, Guid channelId, Guid userId);
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

        // Reactions
        Task MarkChannelAsReadAsync(Guid workspaceId, Guid channelId, Guid userId, Guid messageId);
        Task MarkDmAsReadAsync(Guid workspaceId, Guid dmGroupId, Guid userId, Guid messageId);

        Task AddReactionAsync(Guid workspaceId, Guid messageId, Guid userId, string emoji);

        Task RemoveReactionAsync(Guid workspaceId, Guid messageId, Guid userId, string emoji);
        
        Task<MessageAttachmentDto> UploadAttachmentAsync(Guid workspaceId, Guid userId, System.IO.Stream fileStream, string fileName, string contentType, long size);
    }
}
