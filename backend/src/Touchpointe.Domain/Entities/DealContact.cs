using System;

namespace Touchpointe.Domain.Entities
{
    public class DealContact
    {
        public Guid DealId { get; set; }
        public Deal Deal { get; set; } = null!;

        public Guid ContactId { get; set; }
        public Contact Contact { get; set; } = null!;

        // Optional: Role of the contact in this deal (e.g., Decision Maker, Influencer)
        public string Role { get; set; } = string.Empty;
    }
}
