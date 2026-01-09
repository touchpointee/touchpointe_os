using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public class Company
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    }
}
