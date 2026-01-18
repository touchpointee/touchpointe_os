using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/mentions")]
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

            int takeAmount = page * pageSize;

            // 1. Task Mentions
            var taskMentionsQuery = _context.TaskMentions
                .Include(tm => tm.Task)
                .Include(tm => tm.Task.CreatedBy)
                .Where(tm => tm.UserId == userId)
                .OrderByDescending(tm => tm.CreatedAt)
                .Take(takeAmount)
                .Select(tm => new UserMentionDto
                {
                    Type = MentionType.TASK,
                    WorkspaceId = tm.Task.WorkspaceId,
                    CreatedAt = tm.CreatedAt,
                    PreviewText = tm.Task.Title,
                    TaskId = tm.TaskId,
                    TaskTitle = tm.Task.Title,
                    ActorName = tm.Task.CreatedBy.FullName, // Approximation
                    ActorAvatar = tm.Task.CreatedBy.AvatarUrl
                });

            // 2. Comment Mentions
            var commentMentionsQuery = _context.CommentMentions
                .Include(cm => cm.Comment)
                .Include(cm => cm.Comment.User)
                .Include(cm => cm.Comment.Task)
                .Where(cm => cm.UserId == userId)
                .OrderByDescending(cm => cm.CreatedAt)
                .Take(takeAmount)
                .Select(cm => new UserMentionDto
                {
                    Type = MentionType.COMMENT,
                    WorkspaceId = cm.Comment.Task.WorkspaceId,
                    CreatedAt = cm.CreatedAt,
                    PreviewText = cm.Comment.Content,
                    TaskId = cm.Comment.TaskId,
                    TaskTitle = cm.Comment.Task.Title,
                    ActorName = cm.Comment.User.FullName,
                    ActorAvatar = cm.Comment.User.AvatarUrl
                });

            // 3. Chat Mentions
            var chatMentionsQuery = _context.ChatMentions
                .Include(cm => cm.Message)
                .Include(cm => cm.Message.Sender)
                .Include(cm => cm.Message.Channel)
                .Include(cm => cm.Message.DirectMessageGroup)
                .Include(cm => cm.SourceUser)
                .Where(cm => cm.UserId == userId)
                .OrderByDescending(cm => cm.CreatedAt)
                .Take(takeAmount)
                .Select(cm => new UserMentionDto
                {
                    Type = MentionType.CHAT,
                    WorkspaceId = cm.Message.WorkspaceId,
                    CreatedAt = cm.CreatedAt,
                    PreviewText = cm.Message.Content,
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

            var tMentions = await taskMentionsQuery.ToListAsync();
            var cMentions = await commentMentionsQuery.ToListAsync();
            var chMentions = await chatMentionsQuery.ToListAsync();

            var allMentions = tMentions
                .Concat(cMentions)
                .Concat(chMentions)
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(allMentions);
        }
    }
}
