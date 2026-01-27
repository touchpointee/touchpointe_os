using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/workspaces/{workspaceId}/deals/{dealId}/attachments")]
    public class DealAttachmentController : ControllerBase
    {
        private readonly IDealAttachmentService _attachmentService;
        private readonly ICurrentUserService _currentUserService;

        public DealAttachmentController(IDealAttachmentService attachmentService, ICurrentUserService currentUserService)
        {
            _attachmentService = attachmentService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<List<DealAttachmentDto>>> GetAttachments(Guid workspaceId, Guid dealId)
        {
            return Ok(await _attachmentService.GetAttachmentsAsync(workspaceId, dealId));
        }

        [HttpPost]
        public async Task<ActionResult<DealAttachmentDto>> UploadAttachment(Guid workspaceId, Guid dealId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException();

            using var stream = file.OpenReadStream();
            var result = await _attachmentService.UploadAttachmentAsync(workspaceId, dealId, userId, stream, file.FileName, file.ContentType, file.Length);
            return Ok(result);
        }

        [HttpDelete("{attachmentId}")]
        public async Task<ActionResult> DeleteAttachment(Guid workspaceId, Guid dealId, Guid attachmentId)
        {
            await _attachmentService.DeleteAttachmentAsync(workspaceId, attachmentId);
            return NoContent();
        }
    }
}
