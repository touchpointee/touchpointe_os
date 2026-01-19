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

            // 1. Task Mentions
            var taskMentionsQuery = _context.TaskMentions
                .Where(tm => tm.UserId == userId)
                .Select(tm => new UserMentionDto
                {
                    Type = MentionType.TASK,
                    WorkspaceId = tm.Task.WorkspaceId,
                    CreatedAt = tm.CreatedAt,
                    PreviewText = tm.Task.Title,
                    TaskId = tm.TaskId,
                    TaskTitle = tm.Task.Title,
                    ActorName = tm.Task.CreatedBy.FullName, 
                    ActorAvatar = tm.Task.CreatedBy.AvatarUrl,
                    // Explicit nulls for union compatibility
                    ChannelId = null,
                    DmGroupId = null,
                    MessageId = null,
                    ChannelName = null,
                    SubType = "mention",
                    Info = null
                });

            // 2. Comment Mentions
            var commentMentionsQuery = _context.CommentMentions
                .Where(cm => cm.UserId == userId)
                .Select(cm => new UserMentionDto
                {
                    Type = MentionType.COMMENT,
                    WorkspaceId = cm.Comment.Task.WorkspaceId,
                    CreatedAt = cm.CreatedAt,
                    PreviewText = cm.Comment.Content,
                    TaskId = cm.Comment.TaskId,
                    TaskTitle = cm.Comment.Task.Title,
                    ActorName = cm.Comment.User.FullName,
                    ActorAvatar = cm.Comment.User.AvatarUrl,
                    ChannelId = null,
                    DmGroupId = null,
                    MessageId = null,
                    ChannelName = null,
                    SubType = "mention",
                    Info = null
                });

            // 3. Chat Mentions
            var chatMentionsQuery = _context.ChatMentions
                .Where(cm => cm.UserId == userId)
                .Select(cm => new UserMentionDto
                {
                    Type = MentionType.CHAT,
                    WorkspaceId = cm.Message.WorkspaceId,
                    CreatedAt = cm.CreatedAt,
                    PreviewText = cm.Message.Content,
                    TaskId = null,
                    TaskTitle = null,
                    MessageId = cm.MessageId,
                    ChannelId = cm.Message.ChannelId,
                    DmGroupId = cm.Message.DirectMessageGroupId,
                    ChannelName = cm.Message.Channel != null ? cm.Message.Channel.Name : "Direct Message",
                    ActorName = cm.SourceUserId.HasValue 
                        ? (cm.SourceUser != null ? cm.SourceUser.FullName : cm.Message.Sender.FullName)
                        : cm.Message.Sender.FullName,
                    ActorAvatar = cm.SourceUserId.HasValue 
                        ? (cm.SourceUser != null ? cm.SourceUser.AvatarUrl : cm.Message.Sender.AvatarUrl)
                        : cm.Message.Sender.AvatarUrl,
                    SubType = cm.Type,
                    Info = cm.Info
                });

            // Unified Query (UNION ALL)
            var unionQuery = taskMentionsQuery
                .Concat(commentMentionsQuery)
                .Concat(chatMentionsQuery);

            var result = await unionQuery
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(result);
        }
    }
}
