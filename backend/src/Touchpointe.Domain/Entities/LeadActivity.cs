using System;

namespace Touchpointe.Domain.Entities
{
    public enum LeadActivityType
    {
        CREATED,
        STATUS_CHANGED,
        SCORE_CHANGED,
        NOTE_ADDED,
        CONTACTED,
        ASSIGNED,
        CONVERTED
    }

    public class LeadActivity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid LeadId { get; set; }
        public Lead Lead { get; set; } = null!;

        public Guid? UserId { get; set; }
        public User? User { get; set; }

        public LeadActivityType Type { get; set; }
        public string? Description { get; set; }
        public int? ScoreChange { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
