using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Touchpointe.Domain.Entities
{
    public enum MeetingStatus
    {
        Scheduled,
        Live,
        Ended
    }

    public class Meeting
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public Guid CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        [Required]
        public string JoinCode { get; set; } = string.Empty; // Unique token/room name

        public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;

        public DateTime StartTime { get; set; } // Scheduled start
        public DateTime? EndTime { get; set; }   // Scheduled end

        public DateTime? StartedAt { get; set; } // Actual start (first join)
        public DateTime? EndedAt { get; set; }   // Actual end (last leave)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
    }
}
