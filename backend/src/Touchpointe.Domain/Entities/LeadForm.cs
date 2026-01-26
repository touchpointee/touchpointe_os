using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public class LeadForm
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public Guid CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        public string Name { get; set; } = string.Empty;
        public string Token { get; set; } = Guid.NewGuid().ToString("N"); // Unique public token
        public string? Description { get; set; }

        // Form Configuration
        public string FieldsConfig { get; set; } = "{}"; // JSON: which fields are enabled/required

        // Success Handling
        public string? SuccessRedirectUrl { get; set; }
        public string SuccessMessage { get; set; } = "Thank you for your submission!";

        // Status
        public bool IsActive { get; set; } = true;
        public int SubmissionCount { get; set; } = 0;

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    }
}
