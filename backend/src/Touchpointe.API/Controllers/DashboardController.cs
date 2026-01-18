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
    [Route("api/{workspaceId}/dashboard")]
    [Authorize]
    public class DashboardController : BaseController
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardDataDto>> GetDashboard(Guid workspaceId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _dashboardService.GetDashboardDataAsync(workspaceId, GetUserId(), cancellationToken);
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
