using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

using Microsoft.AspNetCore.RateLimiting;

namespace Touchpointe.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/mentions")]
    [EnableRateLimiting("ApiLimiter")]
    public class MentionsController : BaseController
    {
        private readonly IApplicationDbContext _context;

        public MentionsController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserMentionDto>>> GetMentions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;

            // --- STAGE 1: Fetch Paged IDs (Lightweight Union) ---
            // We project only what is needed for sorting and pagination: Id, CreatedAt, Type
            
            var taskIdsQuery = _context.TaskMentions
                .Where(tm => tm.UserId == userId)
                .Select(tm => new MentionIdProjection 
                { 
                    Id = tm.Id, // The MentionId (not TaskId)
                    CreatedAt = tm.CreatedAt, 
                    Type = MentionType.TASK 
                });

            var commentIdsQuery = _context.CommentMentions
                .Where(cm => cm.UserId == userId)
                .Select(cm => new MentionIdProjection 
                { 
                    Id = cm.Id, 
                    CreatedAt = cm.CreatedAt, 
                    Type = MentionType.COMMENT 
                });

            var chatIdsQuery = _context.ChatMentions
                .Where(cm => cm.UserId == userId)
                .Select(cm => new MentionIdProjection 
                { 
                    Id = cm.Id, 
                    CreatedAt = cm.CreatedAt, 
                    Type = MentionType.CHAT 
                });

            var pagedRefs = await taskIdsQuery
                .Concat(commentIdsQuery)
                .Concat(chatIdsQuery)
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (!pagedRefs.Any())
            {
                return Ok(new List<UserMentionDto>());
            }

            // --- STAGE 2: Fetch Details by Type ---

            var taskMentionIds = pagedRefs.Where(x => x.Type == MentionType.TASK).Select(x => x.Id).ToList();
            var commentMentionIds = pagedRefs.Where(x => x.Type == MentionType.COMMENT).Select(x => x.Id).ToList();
            var chatMentionIds = pagedRefs.Where(x => x.Type == MentionType.CHAT).Select(x => x.Id).ToList();

            var taskMentionsDocs = new List<TaskMention>();
            var commentMentionsDocs = new List<CommentMention>();
            var chatMentionsDocs = new List<ChatMention>();

            if (taskMentionIds.Any())
            {
                taskMentionsDocs = await _context.TaskMentions
                    .Include(tm => tm.Task)
                    .Include(tm => tm.Task.CreatedBy)
                    .Where(tm => taskMentionIds.Contains(tm.Id))
                    .ToListAsync();
            }

            if (commentMentionIds.Any())
            {
                commentMentionsDocs = await _context.CommentMentions
                    .Include(cm => cm.Comment)
                    .Include(cm => cm.Comment.Task)
                    .Include(cm => cm.Comment.User)
                    .Where(cm => commentMentionIds.Contains(cm.Id))
                    .ToListAsync();
            }

            if (chatMentionIds.Any())
            {
                chatMentionsDocs = await _context.ChatMentions
                    .Include(cm => cm.Message)
                    .Include(cm => cm.Message.Channel)
                    .Include(cm => cm.Message.Sender)
                    .Where(cm => chatMentionIds.Contains(cm.Id))
                    .ToListAsync();
            }

            // --- STAGE 3: Merge and Map in Memory ---
            
            var result = new List<UserMentionDto>();

            foreach (var reference in pagedRefs)
            {
                UserMentionDto? dto = null;

                if (reference.Type == MentionType.TASK)
                {
                    var tm = taskMentionsDocs.FirstOrDefault(x => x.Id == reference.Id);
                    if (tm != null && tm.Task != null)
                    {
                        dto = new UserMentionDto
                        {
                            Type = MentionType.TASK,
                            WorkspaceId = tm.Task.WorkspaceId,
                            CreatedAt = tm.CreatedAt,
                            PreviewText = tm.Task.Title,
                            TaskId = tm.TaskId,
                            TaskTitle = tm.Task.Title,
                            ActorName = tm.Task.CreatedBy?.FullName ?? "Unknown",
                            ActorAvatar = tm.Task.CreatedBy?.AvatarUrl,
                            SubType = "mention"
                        };
                    }
                }
                else if (reference.Type == MentionType.COMMENT)
                {
                    var cm = commentMentionsDocs.FirstOrDefault(x => x.Id == reference.Id);
                    if (cm != null && cm.Comment != null)
                    {
                        dto = new UserMentionDto
                        {
                            Type = MentionType.COMMENT,
                            WorkspaceId = cm.Comment.Task.WorkspaceId,
                            CreatedAt = cm.CreatedAt,
                            PreviewText = cm.Comment.Content,
                            TaskId = cm.Comment.TaskId,
                            TaskTitle = cm.Comment.Task.Title,
                            ActorName = cm.Comment.User?.FullName ?? "Unknown",
                            ActorAvatar = cm.Comment.User?.AvatarUrl,
                            SubType = "mention"
                        };
                    }
                }
                else if (reference.Type == MentionType.CHAT)
                {
                    var cm = chatMentionsDocs.FirstOrDefault(x => x.Id == reference.Id);
                    if (cm != null && cm.Message != null)
                    {
                        var senderName = cm.Message.Sender?.FullName ?? "Unknown";
                        var senderAvatar = cm.Message.Sender?.AvatarUrl;
                        var sourceName = cm.SourceUser?.FullName;
                        var sourceAvatar = cm.SourceUser?.AvatarUrl;

                        string actorName = senderName;
                        string? actorAvatar = senderAvatar;

                        if (cm.SourceUserId.HasValue)
                        {
                            actorName = sourceName ?? senderName;
                            actorAvatar = sourceAvatar ?? senderAvatar;
                        }

                        dto = new UserMentionDto
                        {
                            Type = MentionType.CHAT,
                            WorkspaceId = cm.Message.WorkspaceId,
                            CreatedAt = cm.CreatedAt,
                            PreviewText = cm.Message.Content,
                            MessageId = cm.MessageId,
                            ChannelId = cm.Message.ChannelId,
                            DmGroupId = cm.Message.DirectMessageGroupId,
                            ChannelName = cm.Message.Channel?.Name ?? (cm.Message.DirectMessageGroupId.HasValue ? "Direct Message" : null),
                            
                            ActorName = actorName,
                            ActorAvatar = actorAvatar,
                            
                            SubType = cm.Type,
                            Info = cm.Info
                        };
                    }
                }

                if (dto != null)
                {
                    result.Add(dto);
                }
            }

            return Ok(result);
        }

        // Helper class for Stage 1 ID projection
        private class MentionIdProjection
        {
            public Guid Id { get; set; }
            public DateTime CreatedAt { get; set; }
            public MentionType Type { get; set; }
        }

        // Removed old MentionProjection class as it's no longer needed

    }
}
