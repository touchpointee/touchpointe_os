using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("{workspaceId}/team")]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        [HttpGet("members")]
        public async Task<ActionResult<List<TeamMemberDto>>> GetMembers(Guid workspaceId)
        {
            try
            {
                return Ok(await _teamService.GetMembersAsync(workspaceId, GetUserId()));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("invite")]
        public async Task<ActionResult> InviteMember(Guid workspaceId, InviteMemberRequest request)
        {
            try
            {
                await _teamService.InviteMemberAsync(workspaceId, GetUserId(), request);
                return Ok();
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

        [HttpPut("member/{memberId}/role")]
        public async Task<ActionResult> UpdateRole(Guid workspaceId, Guid memberId, UpdateRoleRequest request)
        {
            try
            {
                await _teamService.UpdateMemberRoleAsync(workspaceId, GetUserId(), memberId, request.NewRole);
                return Ok();
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

        [HttpDelete("member/{memberId}")]
        public async Task<ActionResult> RemoveMember(Guid workspaceId, Guid memberId)
        {
            try
            {
                await _teamService.RemoveMemberAsync(workspaceId, GetUserId(), memberId);
                return Ok();
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


        [HttpGet("invitations")]
        public async Task<ActionResult<List<InvitationDto>>> GetInvitations(Guid workspaceId)
        {
            try
            {
                var invitations = await _teamService.GetWorkspaceInvitationsAsync(workspaceId, GetUserId());
                var dtos = invitations.Select(i => new InvitationDto(
                    i.Id,
                    i.Token,
                    "Unknown", // Workspace Name not needed here as we are IN the workspace context, or fetch it if needed. 
                               // Actually DTO expects it. Let's just pass "Current Workspace" or let frontend handle. 
                               // Since we aren't including Workspace in the query, this might be null if entity navigation isn't populated.
                               // Let's check TeamService Include.
                    i.Inviter?.FullName ?? "Unknown",
                    i.Email ?? i.Username ?? "Unknown",
                    i.Role,
                    i.ExpiresAt
                ));
                return Ok(dtos);
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

        [HttpDelete("invitations/{invitationId}")]
        public async Task<ActionResult> RevokeInvitation(Guid workspaceId, Guid invitationId)
        {
            try
            {
                await _teamService.RevokeInvitationAsync(workspaceId, GetUserId(), invitationId);
                return Ok();
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

        [HttpPost("invitations/{invitationId}/resend")]
        public async Task<ActionResult> ResendInvitation(Guid workspaceId, Guid invitationId)
        {
            try
            {
                await _teamService.ResendInvitationAsync(workspaceId, GetUserId(), invitationId);
                return Ok();
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
    }
}
