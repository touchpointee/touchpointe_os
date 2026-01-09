using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Workspaces
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IApplicationDbContext _context;

        public WorkspaceService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WorkspaceDto> CreateWorkspaceAsync(Guid userId, string name)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");

            // Generate unique slug with random suffix to prevent race conditions
            var baseSlug = name.ToLower().Replace(" ", "-");
            var randomSuffix = Guid.NewGuid().ToString("N").Substring(0, 6);
            var slug = $"{baseSlug}-{randomSuffix}";
            
            // Ensure truly unique (edge case fallback)
            var counter = 1;
            while (await _context.Workspaces.AnyAsync(w => w.Slug == slug))
            {
                slug = $"{baseSlug}-{randomSuffix}-{counter++}";
            }

            var workspace = new Domain.Entities.Workspace
            {
                Name = name,
                Slug = slug,
                OwnerId = userId
            };
            _context.Workspaces.Add(workspace);

            var member = new WorkspaceMember
            {
                UserId = userId,
                WorkspaceId = workspace.Id,
                Role = WorkspaceRole.OWNER
            };
            _context.WorkspaceMembers.Add(member);

            // Bootstrap defaults
            var space = new Space
            {
                Name = "General",
                WorkspaceId = workspace.Id,
                Icon = "LayoutGrid"
            };
            _context.Spaces.Add(space);

            var list = new TaskList
            {
                Name = "Inbox",
                WorkspaceId = workspace.Id,
                SpaceId = space.Id
            };
            _context.TaskLists.Add(list);

            var channel = new Channel
            {
                Name = "general",
                WorkspaceId = workspace.Id,
                IsPrivate = false,
                Description = "General discussion"
            };
            channel.Members.Add(new ChannelMember 
            { 
                UserId = userId, 
                WorkspaceId = workspace.Id 
            });
            _context.Channels.Add(channel);

            await _context.SaveChangesAsync(CancellationToken.None);
            
            return new WorkspaceDto(workspace.Id, workspace.Name, workspace.Slug, WorkspaceRole.OWNER);
        }

        public async Task<List<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId)
        {
            return await _context.WorkspaceMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Workspace)
                .Select(m => new WorkspaceDto(
                    m.Workspace.Id,
                    m.Workspace.Name,
                    m.Workspace.Slug,
                    m.Role
                ))
                .ToListAsync();
        }
    }
}
