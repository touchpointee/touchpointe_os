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
    public class MentionsController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public MentionsController(IApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserMentionDto>>> GetMentions()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            // 1. Task Mentions
            var taskMentionsQuery = _context.TaskMentions
                .Include(tm => tm.Task)
                .Include(tm => tm.Task.CreatedBy)
                .Where(tm => tm.UserId == userId)
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
                .Where(cm => cm.UserId == userId)
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
                    ActorName = cm.Message.Sender.FullName,
                    ActorAvatar = cm.Message.Sender.AvatarUrl
                });

            // Union and Sort
            // Note: EF Core might not support Union of disparate selects easily in one query depending on provider.
            // Client-side evaluation is safer for Union of different table sources if projection acts up.
            // But let's try to execute them separately and merge in memory for simplicity/reliability.
            
            var tMentions = await taskMentionsQuery.ToListAsync();
            var cMentions = await commentMentionsQuery.ToListAsync();
            var chMentions = await chatMentionsQuery.ToListAsync();

            var allMentions = tMentions
                .Concat(cMentions)
                .Concat(chMentions)
                .OrderByDescending(m => m.CreatedAt)
                .ToList();

            return Ok(allMentions);
        }
    }
}
