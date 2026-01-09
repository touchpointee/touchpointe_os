using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Domain.Entities;
using System.Text.Json;

namespace Touchpointe.Application.Services.Notifications
{
    public class NotificationService : INotificationService
    {
        private readonly IApplicationDbContext _context;

        public NotificationService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Domain.Entities.Notification>> GetUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync(CancellationToken.None);
            }
        }

        public async Task CreateInvitationNotificationAsync(Guid userId, WorkspaceInvitation invitation)
        {
            var workspace = await _context.Workspaces.FindAsync(invitation.WorkspaceId);
            var inviter = await _context.Users.FindAsync(invitation.InviterId);

            var notification = new Domain.Entities.Notification
            {
                UserId = userId,
                Type = 1, // Invitation type
                Title = "Workspace Invitation",
                Message = $"{inviter?.FullName ?? "Someone"} invited you to join {workspace?.Name ?? "a workspace"}",
                Data = JsonSerializer.Serialize(new { InvitationId = invitation.Id, Token = invitation.Token }),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}
