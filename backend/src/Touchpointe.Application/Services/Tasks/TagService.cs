using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Tasks
{
    public class TagService : ITagService
    {
        private readonly IApplicationDbContext _context;

        public TagService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TagDto>> GetWorkspaceTagsAsync(Guid workspaceId)
        {
            return await _context.Tags
                .Where(t => t.WorkspaceId == workspaceId)
                .Select(t => new TagDto(t.Id, t.Name, t.Color))
                .ToListAsync();
        }

        public async Task<TagDto> CreateTagAsync(Guid workspaceId, string name, string color)
        {
            // Case-insensitive check
            var existing = await _context.Tags
                .FirstOrDefaultAsync(t => t.WorkspaceId == workspaceId && t.Name.ToLower() == name.ToLower());

            if (existing != null) return new TagDto(existing.Id, existing.Name, existing.Color);

            var tag = new Tag
            {
                WorkspaceId = workspaceId,
                Name = name,
                Color = color
            };

            _context.Tags.Add(tag);
            await _context.SaveChangesAsync(default);

            return new TagDto(tag.Id, tag.Name, tag.Color);
        }

        public async Task<TagDto> UpdateTagAsync(Guid workspaceId, Guid tagId, string name, string color)
        {
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Id == tagId && t.WorkspaceId == workspaceId);

            if (tag == null) throw new Exception("Tag not found.");

            tag.Name = name;
            tag.Color = color;

            await _context.SaveChangesAsync(default);

            return new TagDto(tag.Id, tag.Name, tag.Color);
        }

        public async Task DeleteTagAsync(Guid workspaceId, Guid tagId)
        {
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Id == tagId && t.WorkspaceId == workspaceId);

            if (tag != null)
            {
                _context.Tags.Remove(tag);
                await _context.SaveChangesAsync(default);
            }
        }
    }
}
