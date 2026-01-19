using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/team")]
    [Authorize]
    public class TeamController : BaseController
    {
        private readonly ITeamService _teamService;
        private readonly IAuditService _auditService;
        private readonly IApplicationDbContext _context;

        public TeamController(ITeamService teamService, IAuditService auditService, IApplicationDbContext context)
        {
            _teamService = teamService;
            _auditService = auditService;
            _context = context;
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
                var userId = GetUserId();
                await _teamService.UpdateMemberRoleAsync(workspaceId, userId, memberId, request.NewRole);

                // Audit Log
                try 
                {
                    var member = await _context.WorkspaceMembers
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId);
                    
                    var role = member != null ? member.Role.ToString() : "Unknown";

                    await _auditService.LogAsync(userId, workspaceId, role, "Team.RoleChange", memberId.ToString(), HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown", new { NewRole = request.NewRole });
                }
                catch 
                {
                    // Audit failure should not crash the request
                }

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
