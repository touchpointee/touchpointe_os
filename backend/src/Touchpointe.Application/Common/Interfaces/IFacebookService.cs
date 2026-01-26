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
    }

    public class FacebookPageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string? Category { get; set; }
    }
}
