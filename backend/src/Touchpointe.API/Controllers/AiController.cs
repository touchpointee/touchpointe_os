using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs.Agent;
using Touchpointe.Domain.Entities;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("{workspaceId}/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("chat")]
        public async Task<ActionResult<AiResponse>> Chat(Guid workspaceId, [FromBody] AiRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var response = await _aiService.ProcessQueryAsync(request.Query, workspaceId, userId);
            
            return Ok(new AiResponse { Response = response });
        }

        [HttpPost("agent")]
        public async Task<ActionResult<AgentResponse>> Agent(Guid workspaceId, [FromBody] AgentRequest request)
        {
            if (request == null) return BadRequest("Request body cannot be null");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var response = await _aiService.ProcessAgentRequestAsync(request, workspaceId, userId);
            return Ok(response);
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<AiChatMessage>>> GetHistory(Guid workspaceId, [FromQuery] string agentType)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var history = await _aiService.GetChatHistoryAsync(workspaceId, userId, agentType ?? "workspace");
            return Ok(history);
        }

        [HttpDelete("history")]
        public async Task<ActionResult> ClearHistory(Guid workspaceId, [FromQuery] string agentType)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            await _aiService.ClearChatHistoryAsync(workspaceId, userId, agentType ?? "workspace");
            return Ok(new { message = "Chat history cleared" });
        }
    }

    public class AiRequest
    {
        public string Query { get; set; } = string.Empty;
    }

    public class AiResponse
    {
        public string Response { get; set; } = string.Empty;
    }
}
