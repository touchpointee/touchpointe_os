using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IWorkspaceService
    {
        Task<WorkspaceDto> CreateWorkspaceAsync(Guid userId, string name);
        Task<List<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId);
        Task SetLastActiveWorkspaceAsync(Guid userId, Guid workspaceId);
    }
}
