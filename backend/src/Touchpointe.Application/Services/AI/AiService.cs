using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs.Agent;
using Touchpointe.Domain.Entities;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Services.AI
{
    public class AiService : IAiService
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ITaskService _taskService;
        private readonly IChatService _chatService;

        public AiService(IApplicationDbContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory, ITaskService taskService, IChatService chatService)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _taskService = taskService;
            _chatService = chatService;
        }

        public Task<List<AiChatMessage>> GetChatHistoryAsync(Guid workspaceId, Guid userId, string agentType)
            => Task.FromResult(new List<AiChatMessage>());

        public Task ClearChatHistoryAsync(Guid workspaceId, Guid userId, string agentType)
            => Task.CompletedTask;

        public async Task<AgentResponse> ProcessAgentRequestAsync(AgentRequest request, Guid workspaceId, Guid userId)
        {
            // 1. Get data based on agent type
            var contextData = await GetAgentContextDataAsync(request.AgentType, workspaceId, userId);
            
            // 2. Build agent-specific prompt
            var systemPrompt = BuildAgentPrompt(request.AgentType, contextData);
            
            // 3. Build Messages
            var messages = new List<object> { new { role = "system", content = systemPrompt } };
            
            if (request.ConversationHistory != null)
            {
                foreach (var msg in request.ConversationHistory.TakeLast(6))
                    messages.Add(new { role = msg.Role, content = msg.Content });
            }
            messages.Add(new { role = "user", content = request.UserQuery });

            // 4. Call Groq
            var aiReply = await CallGroqChatAsync(messages);

            // 5. Parse and Execute Actions
            var actionResult = await ParseAndExecuteActionsAsync(aiReply, request.AgentType, workspaceId, userId, contextData);
            
            return new AgentResponse
            {
                Markdown = actionResult.ModifiedResponse ?? aiReply,
                RelatedData = actionResult.RelatedData ?? new Dictionary<string, object>()
            };
        }

        private async Task<Dictionary<string, object>> GetAgentContextDataAsync(string agentType, Guid workspaceId, Guid userId)
        {
            var data = new Dictionary<string, object>();
            
            switch (agentType)
            {
                case "task":
                case "workspace":
                    data["tasks"] = (await _taskService.GetMyTasksAsync(userId, workspaceId, 1, 50)).Items;
                    data["lists"] = await _context.TaskLists
                        .Where(l => l.Space.WorkspaceId == workspaceId)
                        .Select(l => new { l.Id, l.Name })
                        .Take(10).ToListAsync();
                    break;
                    
                case "channel":
                    data["channels"] = await _context.Channels
                        .Where(c => c.WorkspaceId == workspaceId)
                        .Select(c => new { c.Id, c.Name })
                        .Take(10).ToListAsync();
                    break;
                    
                case "crm":
                    data["deals"] = await _context.Deals
                        .Where(d => d.WorkspaceId == workspaceId)
                        .Select(d => new { d.Id, d.Name, d.Stage, d.Value })
                        .Take(10).ToListAsync();
                    break;
            }
            
            return data;
        }

        private string BuildAgentPrompt(string agentType, Dictionary<string, object> contextData)
        {
            var baseRules = $@"
TODAY: {DateTime.UtcNow:MMMM dd, yyyy}

STYLE RULES:
• Be extremely concise and point-by-point
• Use small, easy-to-read bullet points
• Use relevant emojis to make it friendly and visual
• Avoid long paragraphs or wordy explanations
• Sound human and helpful, but stay brief

GENERAL RULES:
• Never show JSON, code, or technical details
• If you can't do something, say so clearly
";
            return agentType switch
            {
                "task" => BuildTaskAgentPrompt(contextData) + baseRules,
                "channel" => BuildChannelAgentPrompt(contextData) + baseRules,
                "crm" => BuildCrmAgentPrompt(contextData) + baseRules,
                _ => BuildWorkspaceAgentPrompt(contextData) + baseRules
            };
        }

        private string BuildTaskAgentPrompt(Dictionary<string, object> data)
        {
            var tasks = data.GetValueOrDefault("tasks") as IEnumerable<MyTaskDto> ?? Enumerable.Empty<MyTaskDto>();
            var lists = data.GetValueOrDefault("lists") as IEnumerable<dynamic> ?? Enumerable.Empty<dynamic>();
            
            var taskSummary = tasks.Any() 
                ? string.Join("\n", tasks.Take(8).Select(t => $"• {t.Title} ({t.Status})"))
                : "No tasks yet";
            var listNames = string.Join(", ", lists.Select(l => (string)l.Name));
            var hasLists = lists.Any();

            return $@"You are Hattie, the TASK ASSISTANT for Touchpointe.

YOUR TASKS:
{taskSummary}

AVAILABLE LISTS: {(hasLists ? listNames : "⚠️ None")}

CAPABILITIES:
✅ Create tasks (point-by-point)
✅ List and describe work
❌ Cannot create spaces/lists

{(hasLists ? $@"TO CREATE A TASK - FOLLOW THESE STEPS EXACTLY:

STEP 1: Ask for task name if not given
STEP 2: Ask which list: {listNames}
STEP 3 (Ask confirmation): Say ""I'll create 'TASK NAME' in LIST. Sound good?""
⚠️ DO NOT include [ACTION:...] tag yet!

STEP 4 (After user says yes/confirm): NOW include the action tag:
[ACTION:CREATE_TASK|title=TaskName|listName=ListName]

CRITICAL: The [ACTION:...] tag must ONLY appear AFTER user confirms.
Never execute and ask permission in the same message." : "⚠️ No lists exist. Tell user to create a space and list from the sidebar first.")}";
        }

        private string BuildChannelAgentPrompt(Dictionary<string, object> data)
        {
            var channels = data.GetValueOrDefault("channels") as IEnumerable<dynamic> ?? Enumerable.Empty<dynamic>();
            var channelList = string.Join(", ", channels.Select(c => (string)c.Name));
            var hasChannels = channels.Any();

            return $@"You are Hattie, the CHANNEL ASSISTANT for Touchpointe.

AVAILABLE CHANNELS: {(hasChannels ? channelList : "⚠️ None")}

CAPABILITIES:
✅ Send messages to channels
✅ Summarize channel activity
❌ Cannot create channels - tell user to do it from sidebar

{(hasChannels ? $@"TO SEND A MESSAGE - FOLLOW THESE STEPS EXACTLY:

STEP 1 (First response): Ask for confirmation ONLY. Say something like:
""Got it! I'll send 'MESSAGE' to #CHANNEL. Want me to send it?""
⚠️ DO NOT include [ACTION:...] tag yet!

STEP 2 (After user says yes/confirm/send it): NOW include the action tag:
[ACTION:POST_MESSAGE|channelName=Name|content=Message]

CRITICAL: The [ACTION:...] tag must ONLY appear AFTER user confirms.
Never execute and ask permission in the same message." : "⚠️ No channels exist. Tell user to create one from the sidebar first.")}
";
        }

        private string BuildCrmAgentPrompt(Dictionary<string, object> data)
        {
            var deals = data.GetValueOrDefault("deals") as IEnumerable<dynamic> ?? Enumerable.Empty<dynamic>();
            var dealSummary = deals.Any()
                ? string.Join("\n", deals.Take(5).Select(d => $"• {d.Name} - {d.Stage} (${d.Value})"))
                : "No deals yet";

            return $@"You are Hattie, the CRM ASSISTANT for Touchpointe.

YOUR DEALS:
{dealSummary}

CAPABILITIES:
✅ View deals and pipeline status
✅ Provide CRM insights
❌ Cannot create deals yet - coming soon!

Help users understand their sales pipeline and CRM data.
";
        }

        private string BuildWorkspaceAgentPrompt(Dictionary<string, object> data)
        {
            return $@"You are Hattie, the WORKSPACE ASSISTANT for Touchpointe.

I can help you with general questions about your workspace. For specific actions, please use:
• Tasks tab - for task management
• Channels tab - for messaging
• CRM tab - for sales pipeline
• Team tab - for team info
";
        }

        private async Task<string> CallGroqChatAsync(List<object> messages)
        {
            var apiKey = _configuration["GROQ_API_KEY"];
            if (string.IsNullOrEmpty(apiKey)) throw new Exception("Missing GROQ_API_KEY");

            var model = _configuration["GROQ_MODEL"] ?? "llama-3.3-70b-versatile";
            var apiUrl = _configuration["GROQ_API_URL"] ?? "https://api.groq.com/openai/v1/chat/completions";

            var requestBody = new { model, messages, temperature = 0.7 };
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await client.PostAsync(apiUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Groq Error: {response.StatusCode} - {responseString}");

            using var doc = JsonDocument.Parse(responseString);
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        }

        private async Task<(string? ModifiedResponse, Dictionary<string, object>? RelatedData)> ParseAndExecuteActionsAsync(
            string aiResponse, string agentType, Guid workspaceId, Guid userId, Dictionary<string, object> contextData)
        {
            var actionPattern = @"\[ACTION:(\w+)\|(.+?)\]";
            var match = System.Text.RegularExpressions.Regex.Match(aiResponse, actionPattern);
            
            if (!match.Success) return (null, null);

            var actionType = match.Groups[1].Value;
            var parameters = match.Groups[2].Value.Split('|')
                .Select(p => p.Split('='))
                .Where(kv => kv.Length == 2)
                .ToDictionary(kv => kv[0].Trim(), kv => kv[1].Trim());

            try
            {
                switch (actionType)
                {
                    case "CREATE_TASK":
                        return await HandleCreateTask(aiResponse, actionPattern, parameters, workspaceId, userId, contextData);
                    
                    case "POST_MESSAGE":
                        return await HandlePostMessage(aiResponse, actionPattern, parameters, workspaceId, userId, contextData);
                }
            }
            catch (Exception ex)
            {
                var cleanResp = System.Text.RegularExpressions.Regex.Replace(aiResponse, actionPattern, "").Trim();
                return (cleanResp + $"\n\n⚠️ Error: {ex.Message}", null);
            }

            return (null, null);
        }

        private async Task<(string?, Dictionary<string, object>?)> HandleCreateTask(
            string aiResponse, string pattern, Dictionary<string, string> parameters, 
            Guid workspaceId, Guid userId, Dictionary<string, object> contextData)
        {
            var title = parameters.GetValueOrDefault("title", "Untitled Task");
            var listName = parameters.GetValueOrDefault("listName", "");
            
            var lists = contextData.GetValueOrDefault("lists") as IEnumerable<dynamic> ?? Enumerable.Empty<dynamic>();
            var matchedList = lists.FirstOrDefault(l => ((string)l.Name).Equals(listName, StringComparison.OrdinalIgnoreCase));
            
            Guid listId;
            if (matchedList != null)
                listId = (Guid)matchedList.Id;
            else
            {
                var defaultList = lists.FirstOrDefault();
                if (defaultList == null)
                {
                    var clean = System.Text.RegularExpressions.Regex.Replace(aiResponse, pattern, "").Trim();
                    return (clean + "\n\n⚠️ No lists found. Please create a list first.", null);
                }
                listId = (Guid)defaultList.Id;
            }

            var taskReq = new CreateTaskRequest(listId, title, "", TaskPriorityDto.MEDIUM, userId, null, null);
            var createdTask = await _taskService.CreateTaskAsync(workspaceId, userId, taskReq);

            var cleanResponse = System.Text.RegularExpressions.Regex.Replace(aiResponse, pattern, "").Trim();
            return (string.IsNullOrEmpty(cleanResponse) 
                ? $"✅ Created **\"{createdTask.Title}\"**!" 
                : cleanResponse + $"\n\n✅ Created **\"{createdTask.Title}\"**!", 
                new Dictionary<string, object> { { "createdTaskId", createdTask.Id } });
        }

        private async Task<(string?, Dictionary<string, object>?)> HandlePostMessage(
            string aiResponse, string pattern, Dictionary<string, string> parameters,
            Guid workspaceId, Guid userId, Dictionary<string, object> contextData)
        {
            var channelName = parameters.GetValueOrDefault("channelName", "");
            var content = parameters.GetValueOrDefault("content", "");
            
            var channels = contextData.GetValueOrDefault("channels") as IEnumerable<dynamic> ?? Enumerable.Empty<dynamic>();
            var matchedChannel = channels.FirstOrDefault(c => ((string)c.Name).Equals(channelName, StringComparison.OrdinalIgnoreCase));
            
            if (matchedChannel == null)
            {
                var clean = System.Text.RegularExpressions.Regex.Replace(aiResponse, pattern, "").Trim();
                return (clean + $"\n\n⚠️ Channel '{channelName}' not found.", null);
            }

            var channelId = (Guid)matchedChannel.Id;
            await _chatService.PostChannelMessageAsync(workspaceId, channelId, userId, new PostMessageRequest(content));

            var cleanResponse = System.Text.RegularExpressions.Regex.Replace(aiResponse, pattern, "").Trim();
            return (cleanResponse + "\n\n✅ Message sent!", null);
        }
        
        public async Task<string> ProcessQueryAsync(string query, Guid workspaceId, Guid userId) 
        {
             var req = new AgentRequest { AgentType = "workspace", UserQuery = query };
             var res = await ProcessAgentRequestAsync(req, workspaceId, userId);
             return res.Markdown;
        }
    }
}
