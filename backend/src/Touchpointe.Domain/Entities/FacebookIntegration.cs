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

        // OAuth tokens
        public string? PageAccessToken { get; set; } // Matches DB 'PageAccessToken'
        public string? UserAccessToken { get; set; } // Not in DB yet, but useful
        public DateTime? TokenExpiresAt { get; set; }

        // Facebook IDs
        public string PageId { get; set; } = string.Empty;
        public string PageName { get; set; } = string.Empty;
        public string? AdAccountId { get; set; }
        public string? LeadFormId { get; set; }

        // Status
        public bool IsActive { get; set; } = true;
        public DateTime? LastSyncAt { get; set; }
        public int TotalLeadsSynced { get; set; } = 0;

        // Timestamps
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow; // Matches DB 'ConnectedAt'
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
