using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;
using System.Text.RegularExpressions;

namespace Touchpointe.Application.Services.Chat
{
    public class ChatService : IChatService
    {
        private readonly IApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IChatNotificationService _chatNotification;

        public ChatService(IApplicationDbContext context, INotificationService notificationService, IChatNotificationService chatNotification)
        {
            _context = context;
            _notificationService = notificationService;
            _chatNotification = chatNotification;
        }

        // --- Channels ---

        public async Task<List<ChannelDto>> GetChannelsAsync(Guid workspaceId, Guid userId)
        {
            // Return channels the user is a member of
            return await _context.Channels
                .Where(c => c.WorkspaceId == workspaceId && (!c.IsPrivate || c.Members.Any(m => m.UserId == userId)))
                .Select(c => new ChannelDto(
                    c.Id,
                    c.WorkspaceId,
                    c.Name,
                    c.IsPrivate,
                    c.Description,
                    c.Members.Count
                ))
                .ToListAsync();
        }

        public async Task<ChannelDto> CreateChannelAsync(Guid workspaceId, Guid userId, CreateChannelRequest request)
        {
            // Check name uniqueness in workspace
            if (await _context.Channels.AnyAsync(c => c.WorkspaceId == workspaceId && c.Name == request.Name))
            {
                throw new Exception("Channel name already exists in this workspace");
            }

            var channel = new Channel
            {
                WorkspaceId = workspaceId,
                Name = request.Name,
                IsPrivate = request.IsPrivate,
                Description = request.Description
            };

            _context.Channels.Add(channel);
            
            // Auto-join creator
            _context.ChannelMembers.Add(new ChannelMember
            {
                WorkspaceId = workspaceId,
                ChannelId = channel.Id,
                UserId = userId,
                Channel = channel // Link
            });

            await _context.SaveChangesAsync(CancellationToken.None);

            return new ChannelDto(channel.Id, channel.WorkspaceId, channel.Name, channel.IsPrivate, channel.Description, 1);
        }

        public async Task<bool> JoinChannelAsync(Guid workspaceId, Guid channelId, Guid userId)
        {
            var channel = await _context.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId && c.WorkspaceId == workspaceId);
            
            if (channel == null) return false;
            if (channel.IsPrivate) throw new Exception("Cannot join private channel without invitation"); // Simplification

            var isMember = await _context.ChannelMembers
                .AnyAsync(m => m.ChannelId == channelId && m.UserId == userId);
            
            if (isMember) return true;

            _context.ChannelMembers.Add(new ChannelMember
            {
                WorkspaceId = workspaceId,
                ChannelId = channelId,
                UserId = userId
            });

            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        public async Task<bool> LeaveChannelAsync(Guid workspaceId, Guid channelId, Guid userId)
        {
            var member = await _context.ChannelMembers
                .FirstOrDefaultAsync(m => m.ChannelId == channelId && m.UserId == userId && m.WorkspaceId == workspaceId);
            
            if (member == null) return false;

            _context.ChannelMembers.Remove(member);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        // --- Messages ---

        public async Task<List<MessageDto>> GetChannelMessagesAsync(Guid workspaceId, Guid channelId, Guid userId, int take = 50)
        {
            // Verify access
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null || channel.WorkspaceId != workspaceId) return new List<MessageDto>();

            var isMember = await _context.ChannelMembers
                .AnyAsync(m => m.ChannelId == channelId && m.UserId == userId && m.WorkspaceId == workspaceId);
            
            if (channel.IsPrivate && !isMember) throw new UnauthorizedAccessException("Not a member of this private channel");

            return await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ChannelId == channelId && m.WorkspaceId == workspaceId)
                .OrderByDescending(m => m.CreatedAt) // newest first for pagination
                .Take(take)
                .OrderBy(m => m.CreatedAt) // Return in chronological order
                .Select(m => new MessageDto(
                    m.Id,
                    m.WorkspaceId,
                    m.ChannelId,
                    null,
                    m.SenderId,
                    m.Sender.FullName,
                    m.Content,
                    m.CreatedAt,
                    m.Reactions.Select(r => new MessageReactionDto(
                        r.Id, 
                        r.MessageId, 
                        r.UserId, 
                        r.User.FullName, 
                        r.Emoji, 
                        r.CreatedAt
                    )).ToList()
                ))
                .ToListAsync();
        }

        public async Task<MessageDto> PostChannelMessageAsync(Guid workspaceId, Guid channelId, Guid userId, PostMessageRequest request)
        {
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null || channel.WorkspaceId != workspaceId) throw new Exception("Channel not found");

            var isMember = await _context.ChannelMembers
                .AnyAsync(m => m.ChannelId == channelId && m.UserId == userId && m.WorkspaceId == workspaceId);
            
            if (channel.IsPrivate && !isMember) throw new UnauthorizedAccessException("Not a member of this private channel");
            
            if (!channel.IsPrivate && !isMember)
            {
                 _context.ChannelMembers.Add(new ChannelMember
                {
                    WorkspaceId = workspaceId,
                    ChannelId = channelId,
                    UserId = userId
                });
            }

            var message = new Message
            {
                WorkspaceId = workspaceId,
                ChannelId = channelId,
                SenderId = userId,
                Content = request.Content
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync(CancellationToken.None);

            var sender = await _context.Users.FindAsync(userId);

            // Process Mentions
            await ProcessMentions(request.Content, userId, sender?.FullName ?? "Someone", workspaceId, 
                $"mentioned you in #{channel.Name}", 
                message.Id,
                new { ChannelId = channelId, MessageId = message.Id });
            
            var messageDto = new MessageDto(
                message.Id,
                message.WorkspaceId,
                message.ChannelId,
                null,
                message.SenderId,
                sender?.FullName ?? "Unknown",
                message.Content,
                message.CreatedAt,
                new List<MessageReactionDto>()
            );

            // Real-time broadcast
            await _chatNotification.NotifyMessageAsync(channelId.ToString(), messageDto);

            return messageDto;
        }

        // --- Direct Messages ---

        public async Task<List<DmGroupDto>> GetUserDmGroupsAsync(Guid workspaceId, Guid userId)
        {
            var groupIds = await _context.DirectMessageMembers
                .Where(m => m.UserId == userId) 
                .Select(m => m.DirectMessageGroupId)
                .ToListAsync();

            var groups = await _context.DirectMessageGroups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .Where(g => g.WorkspaceId == workspaceId && groupIds.Contains(g.Id))
                .ToListAsync();

            return groups.Select(g => new DmGroupDto(
                g.Id,
                g.WorkspaceId,
                g.Members.Select(m => new UserDto(m.UserId, m.User.FullName, m.User.Email, m.User.AvatarUrl)).ToList()
            )).ToList();
        }

        public async Task<DmGroupDto> GetOrCreateDmGroupAsync(Guid workspaceId, Guid currentUserId, CreateDmRequest request)
        {
            // Normalize: Ensure current user is in the list
            var userIds = new HashSet<Guid>(request.UserIds);
            userIds.Add(currentUserId);

            if (userIds.Count < 2) throw new Exception("DM must have at least 2 members");

            // Look for existing group with exact same members
            var myGroups = await _context.DirectMessageGroups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .Where(g => g.WorkspaceId == workspaceId && g.Members.Any(m => m.UserId == currentUserId))
                .ToListAsync();

            foreach (var group in myGroups)
            {
                var groupUserIds = new HashSet<Guid>(group.Members.Select(m => m.UserId));
                if (groupUserIds.SetEquals(userIds))
                {
                    // Return existing
                    return new DmGroupDto(
                        group.Id,
                        group.WorkspaceId,
                        group.Members.Select(m => new UserDto(m.UserId, m.User.FullName, m.User.Email, m.User.AvatarUrl)).ToList()
                    );
                }
            }

            // Create new
            var newGroup = new DirectMessageGroup
            {
                WorkspaceId = workspaceId
            };
            
            foreach (var uid in userIds)
            {
                // Verify user exists in workspace
                var exists = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == uid);
                if (!exists) throw new Exception($"User {uid} is not in this workspace");

                newGroup.Members.Add(new DirectMessageMember { UserId = uid });
            }

            _context.DirectMessageGroups.Add(newGroup);
            await _context.SaveChangesAsync(CancellationToken.None);
            
            // Re-fetch to get User names
             var createdGroup = await _context.DirectMessageGroups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstAsync(g => g.Id == newGroup.Id);

             return new DmGroupDto(
                createdGroup.Id,
                createdGroup.WorkspaceId,
                createdGroup.Members.Select(m => new UserDto(m.UserId, m.User.FullName, m.User.Email, m.User.AvatarUrl)).ToList()
            );
        }

        public async Task<List<MessageDto>> GetDmMessagesAsync(Guid workspaceId, Guid dmGroupId, Guid userId, int take = 50)
        {
            var isMember = await _context.DirectMessageMembers
                .AnyAsync(m => m.DirectMessageGroupId == dmGroupId && m.UserId == userId);
            
            // Safer: include Group check
             var group = await _context.DirectMessageGroups
                .FirstOrDefaultAsync(g => g.Id == dmGroupId && g.WorkspaceId == workspaceId);
            
            if (group == null) throw new Exception("DM Group not found");
            
            // We need to check membership again against this group
            var isMemberConfirm = await _context.DirectMessageMembers.AnyAsync(m => m.DirectMessageGroupId == dmGroupId && m.UserId == userId);
            
            if (!isMemberConfirm) throw new UnauthorizedAccessException("Not a member of this DM");

            return await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.DirectMessageGroupId == dmGroupId && m.WorkspaceId == workspaceId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(take)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new MessageDto(
                    m.Id,
                    m.WorkspaceId,
                    null,
                    m.DirectMessageGroupId,
                    m.SenderId,
                    m.Sender.FullName,
                    m.Content,
                    m.CreatedAt,
                    m.Reactions.Select(r => new MessageReactionDto(
                        r.Id, 
                        r.MessageId, 
                        r.UserId, 
                        r.User.FullName, 
                        r.Emoji, 
                        r.CreatedAt
                    )).ToList()
                ))
                .ToListAsync();
        }

        public async Task<MessageDto> PostDmMessageAsync(Guid workspaceId, Guid dmGroupId, Guid userId, PostMessageRequest request)
        {
             var group = await _context.DirectMessageGroups
                .FirstOrDefaultAsync(g => g.Id == dmGroupId && g.WorkspaceId == workspaceId);
            if (group == null) throw new Exception("DM Group not found");

             var isMember = await _context.DirectMessageMembers
                .AnyAsync(m => m.DirectMessageGroupId == dmGroupId && m.UserId == userId);
            
            if (!isMember) throw new UnauthorizedAccessException("Not a member of this DM");

            var message = new Message
            {
                WorkspaceId = workspaceId,
                DirectMessageGroupId = dmGroupId,
                SenderId = userId,
                Content = request.Content
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync(CancellationToken.None);

            var sender = await _context.Users.FindAsync(userId);

            // Process Mentions
            await ProcessMentions(request.Content, userId, sender?.FullName ?? "Someone", workspaceId, 
                "mentioned you in a Direct Message", 
                message.Id,
                new { DmGroupId = dmGroupId, MessageId = message.Id });

            var messageDto = new MessageDto(
                message.Id,
                message.WorkspaceId,
                null,
                message.DirectMessageGroupId,
                message.SenderId,
                sender?.FullName ?? "Unknown",
                message.Content,
                message.CreatedAt,
                new List<MessageReactionDto>()
            );

            // Real-time broadcast
            await _chatNotification.NotifyMessageAsync(dmGroupId.ToString(), messageDto);

            return messageDto;
        }

        public async Task<List<UserDto>> GetWorkspaceMembersAsync(Guid workspaceId)
        {
            return await _context.WorkspaceMembers
                .Include(wm => wm.User)
                .Where(wm => wm.WorkspaceId == workspaceId)
                .Select(wm => new UserDto(
                    wm.UserId,
                    wm.User.FullName,
                    wm.User.Email,
                    wm.User.AvatarUrl
                ))
                .ToListAsync();
        }

        private async Task ProcessMentions(string content, Guid senderId, string senderName, Guid workspaceId, string baseMessage, Guid messageId, object dataObj)
        {
            var mentionRegex = new Regex(@"<@([a-fA-F0-9-]+)\|([^>]+)>");
            var matches = mentionRegex.Matches(content);

            var mentionedUserIds = new HashSet<Guid>();
            foreach (Match match in matches)
            {
                if (Guid.TryParse(match.Groups[1].Value, out Guid uid))
                {
                    if (uid != senderId) // Don't notify or save self-mentions
                    {
                        mentionedUserIds.Add(uid);
                    }
                }
            }

            if (!mentionedUserIds.Any()) return;

            foreach (var uid in mentionedUserIds)
            {
                // Verify user is in workspace
                var isInWorkspace = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == uid);
                
                if (isInWorkspace)
                {
                    // Create ChatMention entity
                    var chatMention = new ChatMention
                    {
                        Id = Guid.NewGuid(),
                        MessageId = messageId,
                        UserId = uid,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ChatMentions.Add(chatMention);

                    // Notification
                    await _notificationService.NotifyUserAsync(
                        uid,
                        "New Mention",
                        $"{senderName} {baseMessage}",
                        2, // Type 2 = Mention
                        System.Text.Json.JsonSerializer.Serialize(dataObj)
                    );
                }
            }
            
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        public async Task AddReactionAsync(Guid workspaceId, Guid messageId, Guid userId, string emoji)
        {
            var message = await _context.Messages
                .Include(m => m.Channel)
                .Include(m => m.DirectMessageGroup)
                .ThenInclude(dm => dm.Members)
                .FirstOrDefaultAsync(m => m.Id == messageId && m.WorkspaceId == workspaceId);

            if (message == null) throw new Exception("Message not found");

            // Verify access
            bool hasAccess = false;
            if (message.ChannelId.HasValue)
            {
                hasAccess = !message.Channel.IsPrivate || await _context.ChannelMembers.AnyAsync(cm => cm.ChannelId == message.ChannelId && cm.UserId == userId);
            }
            else if (message.DirectMessageGroupId.HasValue)
            {
                hasAccess = message.DirectMessageGroup.Members.Any(mm => mm.UserId == userId);
            }

            if (!hasAccess) throw new UnauthorizedAccessException("Cannot react to this message");

            // Check existing
            var existing = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);
            
            if (existing != null) return; // Idempotent

            var reaction = new MessageReaction
            {
                MessageId = messageId,
                UserId = userId,
                Emoji = emoji,
                CreatedAt = DateTime.UtcNow
            };

            _context.MessageReactions.Add(reaction);
            await _context.SaveChangesAsync(CancellationToken.None);

            var user = await _context.Users.FindAsync(userId);

            // Broadcast
            var reactionDto = new MessageReactionDto(reaction.Id, messageId, userId, user?.FullName ?? "Unknown", emoji, reaction.CreatedAt);
            string channelKey = message.ChannelId.HasValue ? message.ChannelId.Value.ToString() : message.DirectMessageGroupId.Value.ToString();
            
            await _chatNotification.NotifyReactionAddedAsync(channelKey, reactionDto);
        }

        public async Task RemoveReactionAsync(Guid workspaceId, Guid messageId, Guid userId, string emoji)
        {
            var reaction = await _context.MessageReactions
                .Include(r => r.Message)
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);
            
            if (reaction == null) return;
            if (reaction.Message.WorkspaceId != workspaceId) throw new UnauthorizedAccessException();

            _context.MessageReactions.Remove(reaction);
            await _context.SaveChangesAsync(CancellationToken.None);

            string channelKey = reaction.Message.ChannelId.HasValue ? reaction.Message.ChannelId.Value.ToString() : reaction.Message.DirectMessageGroupId.Value.ToString();
            await _chatNotification.NotifyReactionRemovedAsync(channelKey, messageId, userId, emoji);
        }

        public async Task MarkChannelAsReadAsync(Guid workspaceId, Guid channelId, Guid userId, Guid messageId)
        {
            var member = await _context.ChannelMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.ChannelId == channelId && m.UserId == userId);
            
            if (member == null) return; // Or throw

            // Only update if newer (optional, but good practice)
            // Ideally we check if messageId exists and its CreatedAt is > current LastRead
            // For now, trust the client or just update.
            member.LastReadMessageId = messageId;
            await _context.SaveChangesAsync(CancellationToken.None);

            await _chatNotification.NotifyReadReceiptAsync(channelId.ToString(), userId, messageId);
        }

        public async Task MarkDmAsReadAsync(Guid workspaceId, Guid dmGroupId, Guid userId, Guid messageId)
        {
             var member = await _context.DirectMessageMembers
                .FirstOrDefaultAsync(m => m.DirectMessageGroupId == dmGroupId && m.UserId == userId);
            
            if (member == null) return;

             // Verify workspace via Group
             var group = await _context.DirectMessageGroups.FindAsync(dmGroupId);
             if (group == null || group.WorkspaceId != workspaceId) return;

             member.LastReadMessageId = messageId;
             await _context.SaveChangesAsync(CancellationToken.None);

             await _chatNotification.NotifyReadReceiptAsync(dmGroupId.ToString(), userId, messageId);
        }
    }
}
