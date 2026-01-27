using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IDealAttachmentService
    {
        Task<DealAttachmentDto> UploadAttachmentAsync(Guid workspaceId, Guid dealId, Guid userId, Stream fileStream, string fileName, string contentType, long size);
        Task<List<DealAttachmentDto>> GetAttachmentsAsync(Guid workspaceId, Guid dealId);
        Task DeleteAttachmentAsync(Guid workspaceId, Guid attachmentId);
    }
}
