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
    [Route("api/workspaces/{workspaceId}")]
    [Authorize]
    public class TimeTrackingController : BaseController
    {
        private readonly ITimeTrackingService _service;

        public TimeTrackingController(ITimeTrackingService service)
        {
            _service = service;
        }

        [HttpPost("tasks/{taskId}/time/start")]
        public async Task<ActionResult<TimeEntryDto>> StartTimer(Guid workspaceId, Guid taskId, [FromBody] StartTimerRequest request)
        {
            var result = await _service.StartTimerAsync(workspaceId, taskId, GetUserId(), request);
            return Ok(result);
        }

        [HttpPost("tasks/{taskId}/time/stop")]
        public async Task<ActionResult<TimeEntryDto>> StopTimer(Guid workspaceId, Guid taskId)
        {
            var result = await _service.StopTimerAsync(workspaceId, taskId, GetUserId());
            return Ok(result);
        }

        [HttpPost("tasks/{taskId}/time/manual")]
        public async Task<ActionResult<TimeEntryDto>> LogManualTime(Guid workspaceId, Guid taskId, [FromBody] ManualTimeRequest request)
        {
            var result = await _service.LogManualTimeAsync(workspaceId, taskId, GetUserId(), request);
            return Ok(result);
        }

        [HttpGet("tasks/{taskId}/time")]
        public async Task<ActionResult<List<TimeEntryDto>>> GetEntries(Guid workspaceId, Guid taskId)
        {
            var result = await _service.GetTaskTimeEntriesAsync(workspaceId, taskId);
            return Ok(result);
        }

        [HttpPut("time/{entryId}")]
        public async Task<ActionResult<TimeEntryDto>> UpdateEntry(Guid workspaceId, Guid entryId, [FromBody] UpdateTimeEntryRequest request)
        {
            var result = await _service.UpdateEntryAsync(workspaceId, entryId, GetUserId(), request);
            return Ok(result);
        }

        [HttpDelete("time/{entryId}")]
        public async Task<ActionResult> DeleteEntry(Guid workspaceId, Guid entryId)
        {
            await _service.DeleteEntryAsync(workspaceId, entryId, GetUserId());
            return NoContent();
        }
        
        [HttpGet("time/active")]
        public async Task<ActionResult<TimeEntryDto?>> GetActiveTimer(Guid workspaceId)
        {
            var result = await _service.GetActiveTimerAsync(workspaceId, GetUserId());
            return Ok(result);
        }
    }
}
