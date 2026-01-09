using System.Collections.Generic;

namespace Touchpointe.Application.DTOs.Agent
{
    public class AgentRequest
    {
        public string AgentType { get; set; } = "workspace"; // "task", "crm", "team", "workspace"
        public string Intent { get; set; } = string.Empty; // "summarize_tasks", "risk_analysis", "query"
        public Dictionary<string, string> Filters { get; set; } = new Dictionary<string, string>();
        public string UserQuery { get; set; } = string.Empty;
    }

    public class AgentResponse
    {
        public string Markdown { get; set; } = string.Empty;
        public Dictionary<string, object> RelatedData { get; set; } = new Dictionary<string, object>();
    }
}
