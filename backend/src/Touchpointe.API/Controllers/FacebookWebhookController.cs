using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/webhooks/facebook")]
    [AllowAnonymous]
    public class FacebookWebhookController : ControllerBase
    {
        private readonly IFacebookService _facebookService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FacebookWebhookController> _logger;

        public FacebookWebhookController(
            IFacebookService facebookService,
            IConfiguration configuration,
            ILogger<FacebookWebhookController> logger)
        {
            _facebookService = facebookService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string mode,
            [FromQuery(Name = "hub.verify_token")] string token,
            [FromQuery(Name = "hub.challenge")] string challenge)
        {
            var verifyToken = _configuration["Facebook:WebhookVerifyToken"] ?? "touchpointe_verify_token";

            if (mode == "subscribe" && token == verifyToken)
            {
                _logger.LogInformation("Facebook webhook verified");
                // FB expects the challenge string back directly as plain text
                return Ok(challenge);
            }

            _logger.LogWarning("Facebook webhook verification failed");
            return BadRequest();
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveUpdate()
        {
            // Read body manually to pass as string
            using var reader = new System.IO.StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();

            _logger.LogInformation($"Received Facebook webhook: {payload}");

            try
            {
                // Verify signature here if needed (X-Hub-Signature-256)
                
                await _facebookService.ProcessWebhookPayloadAsync(payload);
                return Ok();
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error processing Facebook webhook");
                // Return Ok to prevent FB from retrying indefinitely if it's a parsing error
                return Ok(); 
            }
        }
    }
}
