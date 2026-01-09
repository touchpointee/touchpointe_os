using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface INotificationService
    {
        Task<List<Touchpointe.Domain.Entities.Notification>> GetUserNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task CreateInvitationNotificationAsync(Guid userId, WorkspaceInvitation invitation);
    }
}
