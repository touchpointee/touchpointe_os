using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Touchpointe.Application.DTOs.Agent
{
    public class AiToolDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public JsonElement Parameters { get; set; } // JSON Schema
    }

    public class AiToolCall
    {
        public string Id { get; set; } = string.Empty;
        public string FunctionName { get; set; } = string.Empty;
        public string Arguments { get; set; } = string.Empty; // JSON string
    }

    public class AiToolResult
    {
        public string ToolCallId { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
    }
}
