using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IInvitationService _invitationService;

        public NotificationsController(INotificationService notificationService, IInvitationService invitationService)
        {
            _notificationService = notificationService;
            _invitationService = invitationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(notifications.Select(n => new 
            {
                n.Id,
                n.Type,
                n.Title,
                n.Message,
                n.Data,
                n.IsRead,
                n.CreatedAt
            }));
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok();
        }

        // Accept invitation via notification
        [HttpPost("invitations/{token}/accept")]
        public async Task<IActionResult> AcceptInvitation(string token)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized();
                }

                await _invitationService.AcceptInvitationAsync(token, userId);
                return Ok(new { message = "Invitation accepted" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Reject invitation via notification
        [HttpPost("invitations/{token}/reject")]
        public async Task<IActionResult> RejectInvitation(string token)
        {
            try
            {
                await _invitationService.RejectInvitationAsync(token);
                return Ok(new { message = "Invitation rejected" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
