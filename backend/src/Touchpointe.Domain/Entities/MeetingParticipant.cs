using System;
using System.Collections.Generic;

namespace Touchpointe.Domain.Entities
{
    public class MeetingParticipant
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MeetingId { get; set; }
        public Meeting Meeting { get; set; } = null!;

        public Guid? UserId { get; set; }
        public User? User { get; set; }

        public string? GuestName { get; set; } // Populated if UserId is null

        public DateTime FirstJoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLeftAt { get; set; }

        public double TotalDurationSeconds { get; set; } = 0;

        // Navigation
        public ICollection<MeetingSession> Sessions { get; set; } = new List<MeetingSession>();
    }
}
