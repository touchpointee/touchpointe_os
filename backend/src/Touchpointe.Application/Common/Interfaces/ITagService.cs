using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITagService
    {
        Task<List<TagDto>> GetWorkspaceTagsAsync(Guid workspaceId);
        Task<TagDto> CreateTagAsync(Guid workspaceId, string name, string color);
        Task<TagDto> UpdateTagAsync(Guid workspaceId, Guid tagId, string name, string color);
        Task DeleteTagAsync(Guid workspaceId, Guid tagId);
    }
}
