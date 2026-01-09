using System;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum InvitationStatus
    {
        PENDING,
        ACCEPTED,
        REJECTED,
        EXPIRED
    }

    public class WorkspaceInvitation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; }
        
        public Guid InviterId { get; set; }
        public User Inviter { get; set; }
        
        // For invitations by username - stores resolved user_id
        public Guid? InviteeId { get; set; }
        public User? Invitee { get; set; }
        
        public string? Email { get; set; }
        public string? Username { get; set; }
        
        public WorkspaceRole Role { get; set; }
        
        public InvitationStatus Status { get; set; } = InvitationStatus.PENDING;
        
        public string Token { get; set; } = string.Empty; // For email link
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
    }
}
