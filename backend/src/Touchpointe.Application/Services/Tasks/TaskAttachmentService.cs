using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs.Tasks;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Tasks
{
    public class TaskAttachmentService : ITaskAttachmentService
    {
        private readonly IApplicationDbContext _context;
        private readonly IMinioService _minioService;

        public TaskAttachmentService(IApplicationDbContext context, IMinioService minioService)
        {
            _context = context;
            _minioService = minioService;
        }

        public async Task<TaskAttachmentDto> UploadAttachmentAsync(Guid workspaceId, Guid taskId, Guid userId, Stream fileStream, string fileName, string contentType, long size)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.WorkspaceId == workspaceId);
            if (task == null) throw new Exception("Task not found");

            // Generate unique object name
            var extension = Path.GetExtension(fileName);
            var objectName = $"workspaces/{workspaceId}/tasks/{taskId}/{Guid.NewGuid()}{extension}";
            var bucketName = "touchpointe-attachments"; // Or configurable

            // Upload using Stream - MinioService handles bucket creation
            var url = await _minioService.UploadFileAsync(fileStream, contentType, bucketName, objectName);

            var attachment = new TaskAttachment
            {
                Id = Guid.NewGuid(),
                TaskId = taskId,
                UserId = userId, 
                WorkspaceId = workspaceId,
                FileName = fileName,
                StoredFileName = objectName,
                ContentType = contentType,
                Size = size,
                CreatedAt = DateTime.UtcNow // Fixed property name
            };

             _context.TaskAttachments.Add(attachment); 
            await _context.SaveChangesAsync(CancellationToken.None); // Fixed Token

            return MapToDto(attachment, url);
        }

        public async Task<List<TaskAttachmentDto>> GetAttachmentsAsync(Guid workspaceId, Guid taskId)
        {
            var attachments = await _context.TaskAttachments
                .Include(a => a.User)
                .Where(a => a.TaskId == taskId && a.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var dtos = new List<TaskAttachmentDto>();
            foreach (var att in attachments)
            {
                var url = await _minioService.GetFileUrlAsync("touchpointe-attachments", att.StoredFileName);
                dtos.Add(MapToDto(att, url));
            }
            return dtos;
        }

        public async Task DeleteAttachmentAsync(Guid workspaceId, Guid attachmentId)
        {
            var attachment = await _context.TaskAttachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.WorkspaceId == workspaceId);
            if (attachment == null) return; 
            
            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync(CancellationToken.None); // Fixed Token
        }

        private static TaskAttachmentDto MapToDto(TaskAttachment entity, string url)
        {
            return new TaskAttachmentDto
            {
                Id = entity.Id,
                TaskId = entity.TaskId,
                UserId = entity.UserId,
                UserName = entity.User?.FullName ?? "System",
                FileName = entity.FileName,
                ContentType = entity.ContentType,
                Size = entity.Size,
                Url = url,
                CreatedAt = entity.CreatedAt // Fixed property name
            };
        }
    }
}
