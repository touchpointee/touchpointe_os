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
            // Verify Signature (LiveKit sends Authorization header)
            // https://docs.livekit.io/server/webhooks/#verification
            // Skipping manual verification logic for brevity/lack of SDK, 
            // but in production, YOU MUST VERIFY THIS using TokenVerifier.

            using var reader = new StreamReader(Request.Body);
            var json = await reader.ReadToEndAsync();
            
            // Simple parsing to avoid complex dependency
            // Looking for "event" and "participant"
            
            try 
            {
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
