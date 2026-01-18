using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/workspaces/{workspaceId}/tags")]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagsController(ITagService tagService)
        {
            _tagService = tagService;
        }

        [HttpGet]
        public async Task<ActionResult<List<TagDto>>> GetTags(Guid workspaceId)
        {
            var tags = await _tagService.GetWorkspaceTagsAsync(workspaceId);
            return Ok(tags);
        }

        [HttpPost]
        public async Task<ActionResult<TagDto>> CreateTag(Guid workspaceId, [FromBody] CreateTagRequest request)
        {
            var tag = await _tagService.CreateTagAsync(workspaceId, request.Name, request.Color);
            return Ok(tag);
        }

        [HttpPut("{tagId}")]
        public async Task<ActionResult<TagDto>> UpdateTag(Guid workspaceId, Guid tagId, [FromBody] CreateTagRequest request)
        {
            var tag = await _tagService.UpdateTagAsync(workspaceId, tagId, request.Name, request.Color);
            return Ok(tag);
        }

        [HttpDelete("{tagId}")]
        public async Task<IActionResult> DeleteTag(Guid workspaceId, Guid tagId)
        {
            await _tagService.DeleteTagAsync(workspaceId, tagId);
            return NoContent();
        }
    }

    public record CreateTagRequest(string Name, string Color);
}
