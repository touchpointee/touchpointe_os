using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    public record CreateWorkspaceRequest(string Name);

    public record WorkspaceDto(
        Guid Id,
        string Name,
        string Slug,
        WorkspaceRole UserRole
    );
}
