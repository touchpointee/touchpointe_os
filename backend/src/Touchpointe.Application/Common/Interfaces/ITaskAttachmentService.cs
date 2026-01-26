using Touchpointe.Application.DTOs.Tasks;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITaskAttachmentService
    {
        Task<TaskAttachmentDto> UploadAttachmentAsync(Guid workspaceId, Guid taskId, Guid userId, Stream fileStream, string fileName, string contentType, long size);
        Task<List<TaskAttachmentDto>> GetAttachmentsAsync(Guid workspaceId, Guid taskId);
        Task DeleteAttachmentAsync(Guid workspaceId, Guid attachmentId);
    }
}
