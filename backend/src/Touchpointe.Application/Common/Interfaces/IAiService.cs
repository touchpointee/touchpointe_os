using Touchpointe.Application.DTOs.Agent;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IAiService
    {
        Task<AgentResponse> ProcessAgentRequestAsync(AgentRequest request, Guid workspaceId, Guid userId);
        Task<string> ProcessQueryAsync(string query, Guid workspaceId, Guid userId);
        Task<List<Domain.Entities.AiChatMessage>> GetChatHistoryAsync(Guid workspaceId, Guid userId, string agentType);
        Task ClearChatHistoryAsync(Guid workspaceId, Guid userId, string agentType);
    }
}
