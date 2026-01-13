using System.Collections.Generic;

namespace Touchpointe.Application.DTOs.Agent
{
    public class AgentRequest
    {
        public string AgentType { get; set; } = "workspace"; // "task", "crm", "team", "workspace"
        public string Intent { get; set; } = string.Empty; // "summarize_tasks", "risk_analysis", "query"
        public Dictionary<string, string> Filters { get; set; } = new Dictionary<string, string>();
        public string UserQuery { get; set; } = string.Empty;
        public List<ContextEntityDto> ContextEntities { get; set; } = new List<ContextEntityDto>();
        public List<ChatMessageDto> ConversationHistory { get; set; } = new List<ChatMessageDto>(); // For multi-turn
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = "user"; // "user" or "assistant"  
        public string Content { get; set; } = string.Empty;
    }

    public class ContextEntityDto
    {
        public string Type { get; set; } = string.Empty; // channel, user, task
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class AgentResponse
    {
        public string Markdown { get; set; } = string.Empty;
        public Dictionary<string, object> RelatedData { get; set; } = new Dictionary<string, object>();
    }
}
