using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces")]
    [Authorize]
    public class WorkspaceController : ControllerBase
    {
        private readonly IWorkspaceService _workspaceService;
        private readonly ITeamService _teamService;

        public WorkspaceController(IWorkspaceService workspaceService, ITeamService teamService)
        {
            _workspaceService = workspaceService;
            _teamService = teamService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkspace(CreateWorkspaceRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var workspace = await _workspaceService.CreateWorkspaceAsync(userId, request.Name);
            return Ok(workspace);
        }

        [HttpGet]
        public async Task<ActionResult<List<WorkspaceDto>>> GetMyWorkspaces()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var workspaces = await _workspaceService.GetUserWorkspacesAsync(userId);
            return Ok(workspaces);
        }

        [HttpPost("invitations/accept")]
        public async Task<ActionResult<WorkspaceDto>> AcceptInvitation(AcceptInvitationRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            try
            {
                var workspace = await _teamService.AcceptInvitationAsync(request.Token, userId);
                return Ok(workspace);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{id}/visit")]
        public async Task<IActionResult> VisitWorkspace(Guid id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            try
            {
                await _workspaceService.SetLastActiveWorkspaceAsync(userId, id);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class AcceptInvitationRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
