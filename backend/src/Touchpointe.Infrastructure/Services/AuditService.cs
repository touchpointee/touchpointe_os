using System.Text.Json;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Infrastructure.Services
{
    public class AuditService : IAuditService
    {
        private readonly IApplicationDbContext _context;

        public AuditService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(Guid userId, Guid? workspaceId, string actorRole, string action, string targetId, string ipAddress, object? metadata = null)
        {
            var log = new AuditLog
            {
                UserId = userId,
                WorkspaceId = workspaceId,
                ActorRole = actorRole,
                Action = action,
                TargetId = targetId,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow,
                Metadata = metadata != null ? JsonSerializer.Serialize(metadata) : null
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync(default);
        }
    }
}
