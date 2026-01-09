using System;

namespace Touchpointe.Domain.Entities
{
    public class AiChatMessage
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid WorkspaceId { get; set; }
        public string AgentType { get; set; } = string.Empty; // "workspace", "task", "crm", "team", "channel"
        public string Content { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "user" or "assistant"
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties if strictly needed, but for loose coupling/performance we might skip them unless required by EF constraints.
        // Keeping it simple for now as requested for persistence.
        public User User { get; set; }
        public Workspace Workspace { get; set; }
    }
}
