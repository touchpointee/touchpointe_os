namespace Touchpointe.Application.Common.Interfaces
{
    public interface IWorkspaceContext
    {
        Guid? WorkspaceId { get; }
        void SetWorkspaceId(Guid workspaceId);
    }
}
