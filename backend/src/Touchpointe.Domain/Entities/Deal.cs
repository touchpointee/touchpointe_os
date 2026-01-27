using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public enum DealStage
    {
        NEW,
        DISCOVERY,
        PROPOSAL,
        NEGOTIATION,
        CLOSED_WON,
        CLOSED_LOST
    }

    public class Deal
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public Guid? CompanyId { get; set; }
        // ContactId removed - using Many-to-Many via DealContact
        
        public string Name { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public DealStage Stage { get; set; } = DealStage.NEW;
        public DateTime? CloseDate { get; set; }
        public int OrderIndex { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Company? Company { get; set; }
        public ICollection<DealContact> DealContacts { get; set; } = new List<DealContact>();
        public ICollection<DealComment> Comments { get; set; } = new List<DealComment>();
        public ICollection<DealAttachment> Attachments { get; set; } = new List<DealAttachment>();
    }
}
