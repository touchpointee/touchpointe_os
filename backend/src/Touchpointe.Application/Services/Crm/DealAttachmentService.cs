using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Crm
{
    public class DealAttachmentService : IDealAttachmentService
    {
        private readonly IApplicationDbContext _context;
        private readonly IMinioService _minioService;

        public DealAttachmentService(IApplicationDbContext context, IMinioService minioService)
        {
            _context = context;
            _minioService = minioService;
        }

        public async Task<DealAttachmentDto> UploadAttachmentAsync(Guid workspaceId, Guid dealId, Guid userId, Stream fileStream, string fileName, string contentType, long size)
        {
            var deal = await _context.Deals.FirstOrDefaultAsync(d => d.Id == dealId && d.WorkspaceId == workspaceId);
            if (deal == null) throw new Exception("Deal not found");

            // Generate unique object name
            var extension = Path.GetExtension(fileName);
            var objectName = $"workspaces/{workspaceId}/deals/{dealId}/{Guid.NewGuid()}{extension}";
            var bucketName = "touchpointe-attachments";

            // Upload using Stream
            var url = await _minioService.UploadFileAsync(fileStream, contentType, bucketName, objectName);

            var attachment = new DealAttachment
            {
                Id = Guid.NewGuid(),
                DealId = dealId,
                UserId = userId,
                WorkspaceId = workspaceId,
                FileName = fileName,
                StoredFileName = objectName,
                ContentType = contentType,
                Size = size,
                CreatedAt = DateTime.UtcNow
            };

            _context.DealAttachments.Add(attachment);
            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(attachment, url);
        }

        public async Task<List<DealAttachmentDto>> GetAttachmentsAsync(Guid workspaceId, Guid dealId)
        {
            var attachments = await _context.DealAttachments
                .Include(a => a.User)
                .Where(a => a.DealId == dealId && a.WorkspaceId == workspaceId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var dtos = new List<DealAttachmentDto>();
            foreach (var att in attachments)
            {
                var url = await _minioService.GetFileUrlAsync("touchpointe-attachments", att.StoredFileName);
                dtos.Add(MapToDto(att, url));
            }
            return dtos;
        }

        public async Task DeleteAttachmentAsync(Guid workspaceId, Guid attachmentId)
        {
            var attachment = await _context.DealAttachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.WorkspaceId == workspaceId);
            if (attachment == null) return;

            _context.DealAttachments.Remove(attachment);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        private static DealAttachmentDto MapToDto(DealAttachment entity, string url)
        {
            return new DealAttachmentDto
            {
                Id = entity.Id,
                UserId = entity.UserId,
                UserName = entity.User?.FullName ?? "System",
                FileName = entity.FileName,
                ContentType = entity.ContentType,
                Size = entity.Size,
                Url = url,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
