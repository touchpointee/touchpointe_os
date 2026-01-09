using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public class Contact
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public Guid? CompanyId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Company? Company { get; set; }
        public ICollection<DealContact> DealContacts { get; set; } = new List<DealContact>();
        
        public string FullName => $"{FirstName} {LastName}".Trim();
    }
}
