using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("{workspaceId}/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardDataDto>> GetDashboard(Guid workspaceId)
        {
            try
            {
                var data = await _dashboardService.GetDashboardDataAsync(workspaceId, GetUserId());
                return Ok(data);
            }
            catch (Exception ex)
            {
                // In production, log error
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
