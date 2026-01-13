using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/{workspaceId}/hierarchy")]
    [Authorize]
    public class HierarchyController : ControllerBase
    {
        private readonly ITaskHierarchyService _hierarchyService;

        public HierarchyController(ITaskHierarchyService hierarchyService)
        {
            _hierarchyService = hierarchyService;
        }

        // GET /{workspaceId}/hierarchy
        [HttpGet]
        public async Task<ActionResult<List<SpaceHierarchyDto>>> GetHierarchy(Guid workspaceId)
        {
            var hierarchy = await _hierarchyService.GetWorkspaceHierarchyAsync(workspaceId);
            return Ok(hierarchy);
        }

        // === SPACES ===
        [HttpPost("spaces")]
        public async Task<ActionResult<SpaceDto>> CreateSpace(Guid workspaceId, CreateSpaceRequest request)
        {
            try
            {
                var space = await _hierarchyService.CreateSpaceAsync(workspaceId, request);
                return Ok(space);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("spaces/{spaceId}")]
        public async Task<ActionResult<SpaceDto>> UpdateSpace(Guid workspaceId, Guid spaceId, UpdateSpaceRequest request)
        {
            try
            {
                var space = await _hierarchyService.UpdateSpaceAsync(workspaceId, spaceId, request);
                return Ok(space);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("spaces/{spaceId}")]
        public async Task<IActionResult> DeleteSpace(Guid workspaceId, Guid spaceId)
        {
            try
            {
                await _hierarchyService.DeleteSpaceAsync(workspaceId, spaceId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // === FOLDERS ===
        [HttpPost("folders")]
        public async Task<ActionResult<FolderDto>> CreateFolder(Guid workspaceId, CreateFolderRequest request)
        {
            try
            {
                var folder = await _hierarchyService.CreateFolderAsync(workspaceId, request);
                return Ok(folder);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("folders/{folderId}")]
        public async Task<ActionResult<FolderDto>> UpdateFolder(Guid workspaceId, Guid folderId, UpdateFolderRequest request)
        {
            try
            {
                var folder = await _hierarchyService.UpdateFolderAsync(workspaceId, folderId, request);
                return Ok(folder);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("folders/{folderId}")]
        public async Task<IActionResult> DeleteFolder(Guid workspaceId, Guid folderId)
        {
            try
            {
                await _hierarchyService.DeleteFolderAsync(workspaceId, folderId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // === LISTS ===
        [HttpPost("lists")]
        public async Task<ActionResult<ListDto>> CreateList(Guid workspaceId, CreateListRequest request)
        {
            try
            {
                var list = await _hierarchyService.CreateListAsync(workspaceId, request);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("lists/{listId}")]
        public async Task<ActionResult<ListDto>> UpdateList(Guid workspaceId, Guid listId, UpdateListRequest request)
        {
            try
            {
                var list = await _hierarchyService.UpdateListAsync(workspaceId, listId, request);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("lists/{listId}")]
        public async Task<IActionResult> DeleteList(Guid workspaceId, Guid listId)
        {
            try
            {
                await _hierarchyService.DeleteListAsync(workspaceId, listId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
