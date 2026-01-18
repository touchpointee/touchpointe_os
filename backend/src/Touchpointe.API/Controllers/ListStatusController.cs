using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.DTOs;
using Touchpointe.Application.Services.Tasks;

namespace Touchpointe.API.Controllers
{
    [Route("api/workspaces/{workspaceId}")]
    [ApiController]
    [Authorize]
    public class ListStatusController : ControllerBase
    {
        private readonly ListStatusService _listStatusService;

        public ListStatusController(ListStatusService listStatusService)
        {
            _listStatusService = listStatusService;
        }

        /// <summary>
        /// Get all statuses for a list.
        /// </summary>
        [HttpGet("lists/{listId}/statuses")]
        public async Task<IActionResult> GetStatusesByListId(Guid workspaceId, Guid listId)
        {
            var statuses = await _listStatusService.GetStatusesByListIdAsync(listId);
            return Ok(statuses);
        }

        /// <summary>
        /// Update a status (name and/or color).
        /// </summary>
        [HttpPatch("task-statuses/{statusId}")]
        public async Task<IActionResult> UpdateStatus(Guid workspaceId, Guid statusId, [FromBody] UpdateListStatusRequest request)
        {
            var result = await _listStatusService.UpdateStatusAsync(workspaceId, statusId, request);
            if (result == null)
                return NotFound(new { error = "Status not found or doesn't belong to workspace" });

            return Ok(result);
        }

        /// <summary>
        /// Create a new status for a list.
        /// </summary>
        [HttpPost("lists/{listId}/statuses")]
        public async Task<IActionResult> CreateStatus(Guid workspaceId, Guid listId, [FromBody] CreateListStatusRequest request)
        {
            try
            {
                var result = await _listStatusService.CreateStatusAsync(workspaceId, listId, request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a status.
        /// </summary>
        [HttpDelete("task-statuses/{statusId}")]
        public async Task<IActionResult> DeleteStatus(Guid workspaceId, Guid statusId)
        {
            var result = await _listStatusService.DeleteStatusAsync(workspaceId, statusId);
            if (!result)
                return NotFound(new { error = "Status not found or doesn't belong to workspace" });

            return NoContent();
        }
    }
}
