using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Hierarchy
{
    public class TaskHierarchyService : ITaskHierarchyService
    {
        private readonly IApplicationDbContext _context;

        public TaskHierarchyService(IApplicationDbContext context)
        {
            _context = context;
        }

        // === GET HIERARCHY ===
        public async Task<List<SpaceHierarchyDto>> GetWorkspaceHierarchyAsync(Guid workspaceId)
        {
            var spaces = await _context.Spaces
                .Where(s => s.WorkspaceId == workspaceId)
                .OrderBy(s => s.OrderIndex)
                .Include(s => s.Folders.OrderBy(f => f.OrderIndex))
                    .ThenInclude(f => f.Lists.OrderBy(l => l.OrderIndex))
                .Include(s => s.Lists.Where(l => l.FolderId == null).OrderBy(l => l.OrderIndex))
                .ToListAsync();

            return spaces.Select(s => new SpaceHierarchyDto(
                s.Id,
                s.Name,
                s.Icon,
                s.OrderIndex,
                s.Folders.Select(f => new FolderHierarchyDto(
                    f.Id,
                    f.Name,
                    f.Icon,
                    f.OrderIndex,
                    f.Lists.Select(l => new ListDto(l.Id, l.SpaceId, l.FolderId, l.Name, l.OrderIndex, l.CreatedAt)).ToList()
                )).ToList(),
                s.Lists.Where(l => l.FolderId == null).Select(l => new ListDto(l.Id, l.SpaceId, l.FolderId, l.Name, l.OrderIndex, l.CreatedAt)).ToList()
            )).ToList();
        }

        // === SPACES ===
        public async Task<SpaceDto> CreateSpaceAsync(Guid workspaceId, CreateSpaceRequest request)
        {
            var maxOrder = await _context.Spaces
                .Where(s => s.WorkspaceId == workspaceId)
                .MaxAsync(s => (int?)s.OrderIndex) ?? 0;

            var space = new Space
            {
                WorkspaceId = workspaceId,
                Name = request.Name,
                Icon = request.Icon,
                OrderIndex = maxOrder + 1
            };

            _context.Spaces.Add(space);
            await _context.SaveChangesAsync(CancellationToken.None);

            return new SpaceDto(space.Id, space.Name, space.Icon, space.OrderIndex, space.CreatedAt);
        }

        public async Task<SpaceDto> UpdateSpaceAsync(Guid workspaceId, Guid spaceId, UpdateSpaceRequest request)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == spaceId && s.WorkspaceId == workspaceId);
            if (space == null) throw new Exception("Space not found");

            space.Name = request.Name;
            space.Icon = request.Icon;
            space.OrderIndex = request.OrderIndex;

            await _context.SaveChangesAsync(CancellationToken.None);
            return new SpaceDto(space.Id, space.Name, space.Icon, space.OrderIndex, space.CreatedAt);
        }

        public async Task DeleteSpaceAsync(Guid workspaceId, Guid spaceId)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == spaceId && s.WorkspaceId == workspaceId);
            if (space == null) throw new Exception("Space not found");

            _context.Spaces.Remove(space);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        // === FOLDERS ===
        public async Task<FolderDto> CreateFolderAsync(Guid workspaceId, CreateFolderRequest request)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == request.SpaceId && s.WorkspaceId == workspaceId);
            if (space == null) throw new Exception("Space not found");

            var maxOrder = await _context.Folders
                .Where(f => f.SpaceId == request.SpaceId)
                .MaxAsync(f => (int?)f.OrderIndex) ?? 0;

            var folder = new Folder
            {
                WorkspaceId = workspaceId,
                SpaceId = request.SpaceId,
                Name = request.Name,
                Icon = request.Icon,
                OrderIndex = maxOrder + 1
            };

            _context.Folders.Add(folder);
            await _context.SaveChangesAsync(CancellationToken.None);

            return new FolderDto(folder.Id, folder.SpaceId, folder.Name, folder.Icon, folder.OrderIndex, folder.CreatedAt);
        }

        public async Task<FolderDto> UpdateFolderAsync(Guid workspaceId, Guid folderId, UpdateFolderRequest request)
        {
            var folder = await _context.Folders.FirstOrDefaultAsync(f => f.Id == folderId && f.WorkspaceId == workspaceId);
            if (folder == null) throw new Exception("Folder not found");

            folder.Name = request.Name;
            folder.Icon = request.Icon;
            folder.OrderIndex = request.OrderIndex;

            await _context.SaveChangesAsync(CancellationToken.None);
            return new FolderDto(folder.Id, folder.SpaceId, folder.Name, folder.Icon, folder.OrderIndex, folder.CreatedAt);
        }

        public async Task DeleteFolderAsync(Guid workspaceId, Guid folderId)
        {
            var folder = await _context.Folders.FirstOrDefaultAsync(f => f.Id == folderId && f.WorkspaceId == workspaceId);
            if (folder == null) throw new Exception("Folder not found");

            _context.Folders.Remove(folder);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        // === LISTS ===
        public async Task<ListDto> CreateListAsync(Guid workspaceId, CreateListRequest request)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == request.SpaceId && s.WorkspaceId == workspaceId);
            if (space == null) throw new Exception("Space not found");

            if (request.FolderId.HasValue)
            {
                var folder = await _context.Folders.FirstOrDefaultAsync(f => f.Id == request.FolderId && f.WorkspaceId == workspaceId);
                if (folder == null) throw new Exception("Folder not found");
            }

            var maxOrder = await _context.TaskLists
                .Where(l => l.SpaceId == request.SpaceId && l.FolderId == request.FolderId)
                .MaxAsync(l => (int?)l.OrderIndex) ?? 0;

            var list = new TaskList
            {
                WorkspaceId = workspaceId,
                SpaceId = request.SpaceId,
                FolderId = request.FolderId,
                Name = request.Name,
                OrderIndex = maxOrder + 1
            };

            _context.TaskLists.Add(list);
            await _context.SaveChangesAsync(CancellationToken.None);

            return new ListDto(list.Id, list.SpaceId, list.FolderId, list.Name, list.OrderIndex, list.CreatedAt);
        }

        public async Task<ListDto> UpdateListAsync(Guid workspaceId, Guid listId, UpdateListRequest request)
        {
            var list = await _context.TaskLists.FirstOrDefaultAsync(l => l.Id == listId && l.WorkspaceId == workspaceId);
            if (list == null) throw new Exception("List not found");

            list.Name = request.Name;
            list.OrderIndex = request.OrderIndex;
            list.FolderId = request.FolderId;

            await _context.SaveChangesAsync(CancellationToken.None);
            return new ListDto(list.Id, list.SpaceId, list.FolderId, list.Name, list.OrderIndex, list.CreatedAt);
        }

        public async Task DeleteListAsync(Guid workspaceId, Guid listId)
        {
            var list = await _context.TaskLists.FirstOrDefaultAsync(l => l.Id == listId && l.WorkspaceId == workspaceId);
            if (list == null) throw new Exception("List not found");

            _context.TaskLists.Remove(list);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}
