using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.Infrastructure.Services
{
    public class WorkspaceContext : IWorkspaceContext
    {
        private Guid? _workspaceId;

        public Guid? WorkspaceId => _workspaceId;

        public void SetWorkspaceId(Guid workspaceId)
        {
            _workspaceId = workspaceId;
        }
    }
}
