using System;

namespace Touchpointe.Domain.Entities
{
    public class MeetingSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MeetingParticipantId { get; set; }
        public MeetingParticipant Participant { get; set; } = null!;

        public DateTime JoinTime { get; set; } = DateTime.UtcNow;
        public DateTime? LeaveTime { get; set; }

        public double DurationSeconds 
        { 
            get 
            {
                if (!LeaveTime.HasValue) return 0;
                return (LeaveTime.Value - JoinTime).TotalSeconds;
            }
        }
    }
}
