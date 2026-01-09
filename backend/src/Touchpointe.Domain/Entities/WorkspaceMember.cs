using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum WorkspaceRole
    {
        OWNER,
        ADMIN,
        MEMBER,
        VIEWER
    }

    public class WorkspaceMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; }
        
        public Guid UserId { get; set; }
        public User User { get; set; }
        
        public WorkspaceRole Role { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
