using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IInvitationService
    {
        Task<Guid> CreateInvitationAsync(Guid inviterId, Guid workspaceId, string email, WorkspaceRole role);
        Task<Guid> CreateInvitationByUsernameAsync(Guid inviterId, Guid workspaceId, string username, WorkspaceRole role);
        Task AcceptInvitationAsync(string token, Guid userId);
        Task RejectInvitationAsync(string token);
        Task<List<WorkspaceInvitation>> GetPendingInvitationsAsync(Guid userId);
    }
}
