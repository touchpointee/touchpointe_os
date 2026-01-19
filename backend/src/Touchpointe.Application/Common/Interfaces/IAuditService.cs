namespace Touchpointe.Application.Common.Interfaces
{
    public interface IAuditService
    {
        Task LogAsync(Guid userId, Guid? workspaceId, string actorRole, string action, string targetId, string ipAddress, object? metadata = null);
    }
}
