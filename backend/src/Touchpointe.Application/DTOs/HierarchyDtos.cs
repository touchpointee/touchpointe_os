using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    // Spaces
    public record CreateSpaceRequest(string Name, string? Icon);
    public record UpdateSpaceRequest(string Name, string? Icon, int OrderIndex);
    public record SpaceDto(Guid Id, string Name, string? Icon, int OrderIndex, DateTime CreatedAt);

    // Folders
    public record CreateFolderRequest(Guid SpaceId, string Name, string? Icon);
    public record UpdateFolderRequest(string Name, string? Icon, int OrderIndex);
    public record FolderDto(Guid Id, Guid SpaceId, string Name, string? Icon, int OrderIndex, DateTime CreatedAt);

    // Lists
    public record CreateListRequest(Guid SpaceId, Guid? FolderId, string Name);
    public record UpdateListRequest(string Name, int OrderIndex, Guid? FolderId);
    public record ListDto(Guid Id, Guid SpaceId, Guid? FolderId, string Name, int OrderIndex, DateTime CreatedAt);

    // Hierarchy response
    public record SpaceHierarchyDto(
        Guid Id,
        string Name,
        string? Icon,
        int OrderIndex,
        List<FolderHierarchyDto> Folders,
        List<ListDto> Lists
    );

    public record FolderHierarchyDto(
        Guid Id,
        string Name,
        string? Icon,
        int OrderIndex,
        List<ListDto> Lists
    );
}
