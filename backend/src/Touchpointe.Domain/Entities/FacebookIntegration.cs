using System;

namespace Touchpointe.Domain.Entities
{
    public class FacebookIntegration
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid ConnectedByUserId { get; set; }
        public User ConnectedBy { get; set; } = null!;

        // OAuth tokens (should be encrypted in production)
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? TokenExpiresAt { get; set; }

        // Facebook IDs
        public string? PageId { get; set; }
        public string? PageName { get; set; }
        public string? AdAccountId { get; set; }
        public string? LeadFormId { get; set; }

        // Status
        public bool IsActive { get; set; } = true;
        public DateTime? LastSyncAt { get; set; }
        public int TotalLeadsSynced { get; set; } = 0;

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
