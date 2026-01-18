using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Touchpointe.Application.Common.Interfaces;
// You would typically use LiveKit.Server.Sdk.DotNet here to verify signatures
// But since we don't have the package, we'll do a simple implementation or assume secure environment (e.g., private VPC)
// For now, we will assume the webhook is trusted or use a simple secret check if LiveKit supports it in headers.
using Touchpointe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/webhook/livekit")]
    public class LiveKitWebhookController : ControllerBase
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LiveKitWebhookController> _logger;

        public LiveKitWebhookController(
            IApplicationDbContext context,
            IConfiguration configuration,
            ILogger<LiveKitWebhookController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> HandleWebhook()
        {
            try
            {
                // 1. Get Authorization Header
                if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
                {
                    _logger.LogWarning("LiveKit Webhook missing Authorization header");
                    return Unauthorized();
                }

                var jwt = authHeader.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);

                // 2. Read Body
                using var reader = new StreamReader(Request.Body);
                var json = await reader.ReadToEndAsync();

                // 3. Verify Signature & Claims
                var apiKey = _configuration["LiveKit:ApiKey"];
                var apiSecret = _configuration["LiveKit:ApiSecret"];

                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
                {
                    _logger.LogError("LiveKit configuration missing");
                    return StatusCode(500); 
                }

                var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var validationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret)),
                    ValidateIssuer = true,
                    ValidIssuer = apiKey,
                    ValidateAudience = false, // Webhooks don't usually have audience
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                System.Security.Claims.ClaimsPrincipal principal;
                try
                {
                    principal = tokenHandler.ValidateToken(jwt, validationParameters, out var validatedToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "LiveKit Webhook JWT validation failed");
                    return Unauthorized();
                }

                // 4. Verify Body Hash (claim "sha256")
                var sha256Claim = principal.FindFirst("sha256")?.Value;
                if (string.IsNullOrEmpty(sha256Claim))
                {
                    _logger.LogWarning("LiveKit Webhook JWT missing sha256 claim");
                    return Unauthorized();
                }

                using (var sha256 = SHA256.Create())
                {
                    var bytes = Encoding.UTF8.GetBytes(json);
                    var hash = sha256.ComputeHash(bytes);
                    var hashString = Convert.ToBase64String(hash);

                    if (hashString != sha256Claim)
                    {
                        _logger.LogWarning("LiveKit Webhook Body Hash Mismatch. Expected: {Expected}, Actual: {Actual}", sha256Claim, hashString);
                        return Unauthorized();
                    }
                }

                // 5. Process Event
                var evt = System.Text.Json.JsonSerializer.Deserialize<LiveKitWebhookEvent>(json, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (evt == null) return BadRequest();

                if (evt.Event == "participant_left")
                {
                     await HandleParticipantLeft(evt);
                }
                
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing LiveKit webhook");
                return BadRequest();
            }
        }

        private async Task HandleParticipantLeft(LiveKitWebhookEvent evt)
        {
            // Identify participant by Identity (which is UserId or ParticipantId)
            var identity = evt.Participant?.Identity;
            var roomName = evt.Room?.Name;

            if (string.IsNullOrEmpty(identity) || string.IsNullOrEmpty(roomName)) return;

            // Find valid session
            // We need to match the Meeting (by RoomName=JoinCode) and Participant (by Identity)
            
            var meeting = await _context.Meetings
                .Include(m => m.Participants)
                .ThenInclude(p => p.Sessions)
                .FirstOrDefaultAsync(m => m.JoinCode == roomName);

            if (meeting == null) return;

            // Find participant
            var participant = meeting.Participants
                .FirstOrDefault(p => (p.UserId.HasValue && p.UserId.ToString() == identity) || (!p.UserId.HasValue && p.Id.ToString() == identity));
            
            if (participant == null) return;

            // Find active session (LeaveTime is null)
            var session = participant.Sessions.FirstOrDefault(s => s.LeaveTime == null);
            if (session != null)
            {
                session.LeaveTime = DateTime.UtcNow;
                participant.LastLeftAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(CancellationToken.None);
            }
            
            // Check if room is empty to mark ended?
            var activeCount = await _context.MeetingParticipants
                .CountAsync(p => p.MeetingId == meeting.Id && p.Sessions.Any(s => s.LeaveTime == null));
            
            if (activeCount == 0)
            {
                meeting.Status = MeetingStatus.Ended;
                meeting.EndedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(CancellationToken.None);
            }
        }
    }

    // Helper classes for JSON deserialization
    public class LiveKitWebhookEvent
    {
        public required string Event { get; set; }
        public required LiveKitRoom Room { get; set; }
        public required LiveKitParticipant Participant { get; set; }
    }
    public class LiveKitRoom { public required string Name { get; set; } }
    public class LiveKitParticipant { public required string Identity { get; set; } }
}
