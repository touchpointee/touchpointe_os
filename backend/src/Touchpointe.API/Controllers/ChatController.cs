using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("{workspaceId}/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        // --- Channels ---

        [HttpGet("channels")]
        public async Task<ActionResult<List<ChannelDto>>> GetChannels(Guid workspaceId)
        {
            return Ok(await _chatService.GetChannelsAsync(workspaceId, GetUserId()));
        }

        [HttpPost("channels")]
        public async Task<ActionResult<ChannelDto>> CreateChannel(Guid workspaceId, CreateChannelRequest request)
        {
            try
            {
                return Ok(await _chatService.CreateChannelAsync(workspaceId, GetUserId(), request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("channels/{channelId}/join")]
        public async Task<ActionResult> JoinChannel(Guid workspaceId, Guid channelId)
        {
            try
            {
                var success = await _chatService.JoinChannelAsync(workspaceId, channelId, GetUserId());
                if (!success) return NotFound();
                return Ok();
            }
            catch (Exception ex)
            {
                 return BadRequest(new { error = ex.Message });
            }
        }
        
        [HttpPost("channels/{channelId}/leave")]
        public async Task<ActionResult> LeaveChannel(Guid workspaceId, Guid channelId)
        {
             var success = await _chatService.LeaveChannelAsync(workspaceId, channelId, GetUserId());
             if (!success) return NotFound();
             return Ok();
        }

        // --- Messages ---

        [HttpGet("channels/{channelId}/messages")]
        public async Task<ActionResult<List<MessageDto>>> GetChannelMessages(Guid workspaceId, Guid channelId, [FromQuery] int take = 50)
        {
            try 
            {
                return Ok(await _chatService.GetChannelMessagesAsync(workspaceId, channelId, GetUserId(), take));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("channels/{channelId}/messages")]
        public async Task<ActionResult<MessageDto>> PostChannelMessage(Guid workspaceId, Guid channelId, PostMessageRequest request)
        {
            try
            {
                return Ok(await _chatService.PostChannelMessageAsync(workspaceId, channelId, GetUserId(), request));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // --- Direct Messages ---

        [HttpGet("dm")]
        public async Task<ActionResult<List<DmGroupDto>>> GetUserDmGroups(Guid workspaceId)
        {
            return Ok(await _chatService.GetUserDmGroupsAsync(workspaceId, GetUserId()));
        }

        [HttpPost("dm")]
        public async Task<ActionResult<DmGroupDto>> CreateDmGroup(Guid workspaceId, CreateDmRequest request)
        {
            try
            {
                return Ok(await _chatService.GetOrCreateDmGroupAsync(workspaceId, GetUserId(), request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("dm/{dmGroupId}/messages")]
        public async Task<ActionResult<List<MessageDto>>> GetDmMessages(Guid workspaceId, Guid dmGroupId, [FromQuery] int take = 50)
        {
             try
            {
                return Ok(await _chatService.GetDmMessagesAsync(workspaceId, dmGroupId, GetUserId(), take));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("dm/{dmGroupId}/messages")]
        public async Task<ActionResult<MessageDto>> PostDmMessage(Guid workspaceId, Guid dmGroupId, PostMessageRequest request)
        {
             try
            {
                return Ok(await _chatService.PostDmMessageAsync(workspaceId, dmGroupId, GetUserId(), request));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetWorkspaceUsers(Guid workspaceId)
        {
            return Ok(await _chatService.GetWorkspaceMembersAsync(workspaceId));
        }
    }
}
