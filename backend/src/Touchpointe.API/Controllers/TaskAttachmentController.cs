using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs.Tasks;

namespace Touchpointe.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/workspaces/{workspaceId}/tasks/{taskId}/attachments")]
    public class TaskAttachmentController : ControllerBase
    {
        private readonly ITaskAttachmentService _attachmentService;
        private readonly ICurrentUserService _currentUserService;

        public TaskAttachmentController(ITaskAttachmentService attachmentService, ICurrentUserService currentUserService)
        {
            _attachmentService = attachmentService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<List<TaskAttachmentDto>>> GetAttachments(Guid workspaceId, Guid taskId)
        {
            return Ok(await _attachmentService.GetAttachmentsAsync(workspaceId, taskId));
        }

        [HttpPost]
        public async Task<ActionResult<TaskAttachmentDto>> UploadAttachment(Guid workspaceId, Guid taskId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException();
            
            using var stream = file.OpenReadStream();
            var result = await _attachmentService.UploadAttachmentAsync(workspaceId, taskId, userId, stream, file.FileName, file.ContentType, file.Length);
            return Ok(result);
        }

        [HttpDelete("{attachmentId}")]
        public async Task<ActionResult> DeleteAttachment(Guid workspaceId, Guid taskId, Guid attachmentId)
        {
            await _attachmentService.DeleteAttachmentAsync(workspaceId, attachmentId);
            return NoContent();
        }
    }
}
