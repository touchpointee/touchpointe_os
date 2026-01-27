using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IFacebookService
    {
        string GetLoginUrl(Guid workspaceId, string redirectUrl);
        Task<string> ExchangeCodeForTokenAsync(string code, string redirectUrl);
        Task<List<FacebookPageDto>> GetPagesAsync(string userAccessToken);
        Task<FacebookIntegration> ConnectPageAsync(Guid workspaceId, Guid userId, string pageId, string userAccessToken);
        Task<FacebookIntegration?> GetIntegrationAsync(Guid workspaceId);
        Task SubscribeToWebhooksAsync(string pageId, string pageAccessToken);
        Task ProcessWebhookPayloadAsync(string payload);
        Task<List<FacebookFormDto>> GetFormsAsync(string pageId, string pageAccessToken);
        Task<List<FacebookLeadDto>> GetLeadsAsync(string formId, string pageAccessToken, int limit = 50);
        Task ProcessLeadAsync(string leadgenId, string pageId, string formId);
    }

    public class FacebookPageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string? Category { get; set; }
    }

    public class FacebookFormDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int LeadCount { get; set; }
    }

    public class FacebookLeadDto
    {
        public string Id { get; set; } = string.Empty;
        public DateTime CreatedTime { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
    }
}
