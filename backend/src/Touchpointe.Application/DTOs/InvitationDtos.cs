using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    public record CreateInvitationRequest(
        Guid WorkspaceId,
        string Email,
        WorkspaceRole Role
    );

    public record InvitationDto(
        Guid Id,
        string Token,
        string WorkspaceName,
        string InviterName,
        string Email,
        WorkspaceRole Role,
        DateTime ExpiresAt
    );

    public record CreateInvitationByUsernameRequest(
        Guid WorkspaceId,
        string Username,
        WorkspaceRole Role
    );
}
