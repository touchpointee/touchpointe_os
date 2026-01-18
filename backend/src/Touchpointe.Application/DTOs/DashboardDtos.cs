using System;

namespace Touchpointe.Application.DTOs
{
    public class DashboardStatsDto
    {
        public int OpenTasks { get; set; }
        public int DueToday { get; set; }
        public int Overdue { get; set; }
        public int ActiveDeals { get; set; }
        public int CompletedTasksToday { get; set; }
    }

    public class DashboardActivityDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "Task", "Deal", "Comment"
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string UserInitial { get; set; } = string.Empty;
        public string LinkId { get; set; } = string.Empty; // TaskId or DealId
    }


    public class DashboardDataDto
    {
        public DashboardStatsDto Stats { get; set; } = new();
        public List<TaskDto> MyTasks { get; set; } = new(); // Re-using TaskDto
        public List<DashboardActivityDto> RecentActivity { get; set; } = new();
    }
}
