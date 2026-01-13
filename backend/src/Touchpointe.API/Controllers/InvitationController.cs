using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/invitations")]
    [Authorize]
    public class InvitationController : ControllerBase
    {
        private readonly IInvitationService _invitationService;

        public InvitationController(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateInvitation(CreateInvitationRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var inviterId))
                {
                     return Unauthorized();
                }

                var id = await _invitationService.CreateInvitationAsync(inviterId, request.WorkspaceId, request.Email, request.Role);
                return Ok(new { InvitationId = id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("by-username")]
        public async Task<IActionResult> CreateInvitationByUsername(CreateInvitationByUsernameRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var inviterId))
                {
                     return Unauthorized();
                }

                var id = await _invitationService.CreateInvitationByUsernameAsync(inviterId, request.WorkspaceId, request.Username, request.Role);
                return Ok(new { InvitationId = id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{token}/accept")]
        public async Task<IActionResult> AcceptInvitation(string token)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                     return Unauthorized();
                }

                await _invitationService.AcceptInvitationAsync(token, userId);
                return Ok(new { message = "Invitation accepted" });
            }
             catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{token}/reject")]
        public async Task<IActionResult> RejectInvitation(string token)
        {
            try
            {
                await _invitationService.RejectInvitationAsync(token);
                return Ok(new { message = "Invitation rejected" });
            }
             catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<InvitationDto>>> GetPending()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                     return Unauthorized();
                }

                var invitations = await _invitationService.GetPendingInvitationsAsync(userId);
                
                var dtos = invitations.Select(i => new InvitationDto(
                    i.Id,
                    i.Token,
                    i.Workspace.Name,
                    i.Inviter.FullName,
                    i.Email ?? "",
                    i.Role,
                    i.ExpiresAt
                ));

                return Ok(dtos);
            }
             catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
