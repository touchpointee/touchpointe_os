using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Authorize]
    public class FacebookController : BaseController
    {
        private readonly IFacebookService _facebookService;
        private readonly IConfiguration _configuration;

        public FacebookController(IFacebookService facebookService, IConfiguration configuration)
        {
            _facebookService = facebookService;
            _configuration = configuration;
        }

        [HttpGet("api/workspaces/{workspaceId}/integrations/facebook/connect")]
        public ActionResult GetConnectUrl(Guid workspaceId)
        {
            // Callback matches the GENERIC global route below
            var callbackUrl = $"{Request.Scheme}://{Request.Host}/api/integrations/facebook/callback";
            var url = _facebookService.GetLoginUrl(workspaceId, callbackUrl);
            return Ok(new { url });
        }

        // Global callback route
        [HttpGet("api/integrations/facebook/callback")]
        [AllowAnonymous] // Valid auth cookie might not be present if cross-site or separate domain
        public async Task<ActionResult> Callback(string code, string state)
        {
            if (string.IsNullOrEmpty(code)) return BadRequest("No code provided");

            try
            {
                var callbackUrl = $"{Request.Scheme}://{Request.Host}/api/integrations/facebook/callback";
                var userAccessToken = await _facebookService.ExchangeCodeForTokenAsync(code, callbackUrl);

                // Decode state to get workspaceId
                var workspaceIdBytes = Convert.FromBase64String(state);
                var workspaceId = System.Text.Encoding.UTF8.GetString(workspaceIdBytes);

                // Redirect to Frontend
                // Use Origin header or default to localhost
                // Redirect to Frontend
                // Get Frontend URL from config or use a safe default
                var frontendUrl = _configuration["FrontendUrl"];
                if (string.IsNullOrEmpty(frontendUrl)) 
                {
                    // Fallback to Origin if config is missing (for safety)
                    frontendUrl = Request.Headers["Origin"].ToString();
                    if (string.IsNullOrEmpty(frontendUrl)) throw new Exception("FrontendUrl not configured");
                }

                return Redirect($"{frontendUrl}/workspace/{workspaceId}/crm/integrations?facebook_token={userAccessToken}&state={state}");
            }
            catch (Exception ex)
            {
                return Redirect($"http://localhost:5173/settings/integrations?error={Uri.EscapeDataString(ex.Message)}");
            }
        }

        // Workspace-scoped actions
        [HttpGet("api/workspaces/{workspaceId}/integrations/facebook")]
        public async Task<ActionResult> GetStatus(Guid workspaceId)
        {
            var integration = await _facebookService.GetIntegrationAsync(workspaceId);
            if (integration == null) return NoContent();
            return Ok(integration);
        }

        [HttpGet("api/workspaces/{workspaceId}/integrations/facebook/pages")]
        public async Task<ActionResult> GetPages(Guid workspaceId, [FromQuery] string userAccessToken)
        {
            var pages = await _facebookService.GetPagesAsync(userAccessToken);
            return Ok(pages);
        }

        [HttpPost("api/workspaces/{workspaceId}/integrations/facebook/subscribe")]
        public async Task<ActionResult> SubscribePage(Guid workspaceId, [FromBody] ConnectPageRequest request)
        {
            try
            {
                var integration = await _facebookService.ConnectPageAsync(
                    workspaceId, 
                    GetUserId(), 
                    request.PageId, 
                    request.UserAccessToken);
                    
                return Ok(integration);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("api/workspaces/{workspaceId}/integrations/facebook/forms")]
        public async Task<ActionResult> GetForms(Guid workspaceId, [FromQuery] string pageId, [FromQuery] string accessToken)
        {
            try
            {
                var forms = await _facebookService.GetFormsAsync(pageId, accessToken);
                return Ok(forms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("api/workspaces/{workspaceId}/integrations/facebook/forms/{formId}/leads")]
        public async Task<ActionResult> GetLeads(Guid workspaceId, string formId, [FromQuery] string accessToken)
        {
            try
            {
                var leads = await _facebookService.GetLeadsAsync(formId, accessToken);
                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("api/workspaces/{workspaceId}/integrations/facebook/leads/import")]
        public async Task<ActionResult> ImportLeads(Guid workspaceId, [FromBody] ImportLeadsRequest request)
        {
            try
            {
                int successCount = 0;
                int failCount = 0;

                foreach (var leadId in request.LeadIds)
                {
                    try
                    {
                        await _facebookService.ProcessLeadAsync(leadId, request.PageId, request.FormId);
                        successCount++;
                    }
                    catch
                    {
                        failCount++;
                    }
                }

                return Ok(new { imported = successCount, failed = failCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class ConnectPageRequest
    {
        public string PageId { get; set; } = string.Empty;
        public string UserAccessToken { get; set; } = string.Empty;
    }

    public class ImportLeadsRequest
    {
        public string PageId { get; set; } = string.Empty;
        public string FormId { get; set; } = string.Empty;
        public List<string> LeadIds { get; set; } = new();
    }
}
