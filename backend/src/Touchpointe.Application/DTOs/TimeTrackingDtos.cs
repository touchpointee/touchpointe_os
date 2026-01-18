using System;

namespace Touchpointe.Application.DTOs
{
    public class TimeEntryDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatarUrl { get; set; } // Optional if available
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationSeconds { get; set; }
        public string? Description { get; set; }
        public bool IsManual { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class StartTimerRequest
    {
        public string? Description { get; set; }
    }

    public class ManualTimeRequest
    {
        public int DurationSeconds { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; } // Optional: Date of entry, defaults to UtcNow
    }

    public class UpdateTimeEntryRequest
    {
        public int? DurationSeconds { get; set; } // If manual
        public string? Description { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }
}
