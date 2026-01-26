using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public enum LeadSource
    {
        MANUAL,
        FORM,
        FACEBOOK,
        GOOGLE,
        ZAPIER,
        REFERRAL
    }

    public enum LeadStatus
    {
        NEW,
        CONTACTED,
        QUALIFIED,
        UNQUALIFIED,
        CONVERTED
    }

    public class Lead
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid? FormId { get; set; }
        public LeadForm? Form { get; set; }

        public Guid? AssignedToUserId { get; set; }
        public User? AssignedTo { get; set; }

        public Guid? ConvertedToContactId { get; set; }
        public Contact? ConvertedToContact { get; set; }

        // Contact Info
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }

        // Status & Scoring
        public LeadSource Source { get; set; } = LeadSource.MANUAL;
        public LeadStatus Status { get; set; } = LeadStatus.NEW;
        public int Score { get; set; } = 0;
        public string? Notes { get; set; }

        // UTM Tracking
        public string? UtmSource { get; set; }
        public string? UtmMedium { get; set; }
        public string? UtmCampaign { get; set; }

        // External Platform IDs
        public string? FacebookLeadId { get; set; }
        public string? GoogleLeadId { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastActivityAt { get; set; }

        // Navigation
        public ICollection<LeadActivity> Activities { get; set; } = new List<LeadActivity>();

        public string FullName => $"{FirstName} {LastName}".Trim();
    }
}
