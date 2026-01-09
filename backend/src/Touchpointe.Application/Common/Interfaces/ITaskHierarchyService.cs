using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITaskHierarchyService
    {
        // Spaces
        Task<List<SpaceHierarchyDto>> GetWorkspaceHierarchyAsync(Guid workspaceId);
        Task<SpaceDto> CreateSpaceAsync(Guid workspaceId, CreateSpaceRequest request);
        Task<SpaceDto> UpdateSpaceAsync(Guid workspaceId, Guid spaceId, UpdateSpaceRequest request);
        Task DeleteSpaceAsync(Guid workspaceId, Guid spaceId);

        // Folders
        Task<FolderDto> CreateFolderAsync(Guid workspaceId, CreateFolderRequest request);
        Task<FolderDto> UpdateFolderAsync(Guid workspaceId, Guid folderId, UpdateFolderRequest request);
        Task DeleteFolderAsync(Guid workspaceId, Guid folderId);

        // Lists
        Task<ListDto> CreateListAsync(Guid workspaceId, CreateListRequest request);
        Task<ListDto> UpdateListAsync(Guid workspaceId, Guid listId, UpdateListRequest request);
        Task DeleteListAsync(Guid workspaceId, Guid listId);
    }
}
