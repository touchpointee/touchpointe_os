using System;
using System.Collections.Generic;

namespace Touchpointe.Application.DTOs.Agent
{
    public class AgentContext
    {
        public string CurrentIntent { get; set; } = "NONE"; // CREATE_TASK, UPDATE_TASK, SEND_MESSAGE, etc.
        public Dictionary<string, string> DraftTask { get; set; } = new Dictionary<string, string>();
        public LastEntity? LastTask { get; set; }
        public LastEntity? LastChannel { get; set; }
        public LastEntity? LastUser { get; set; }
        public string? LastEntityType { get; set; } // "task", "channel", "user"
    }

    public class LastEntity
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
    }
}
