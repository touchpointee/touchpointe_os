using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Infrastructure.Services
{
    public class FacebookService : IFacebookService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IApplicationDbContext _context;
        private readonly ILeadService _leadService;
        private readonly ILogger<FacebookService> _logger;

        private const string GraphApiVersion = "v19.0";
        private const string BaseUrl = "https://graph.facebook.com";

        public FacebookService(
            HttpClient httpClient,
            IConfiguration configuration,
            IApplicationDbContext context,
            ILeadService leadService,
            ILogger<FacebookService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
            _leadService = leadService;
            _logger = logger;
        }

        public string GetLoginUrl(Guid workspaceId, string redirectUrl)
        {
            var appId = _configuration["Facebook:AppId"];
            var state = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(workspaceId.ToString()));
            
            return $"https://www.facebook.com/{GraphApiVersion}/dialog/oauth" +
                   $"?client_id={appId}" +
                   $"&redirect_uri={Uri.EscapeDataString(redirectUrl)}" +
                   $"&state={state}" +
                   $"&scope=pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_ads,pages_manage_metadata";
        }

        public async Task<string> ExchangeCodeForTokenAsync(string code, string redirectUrl)
        {
            var appId = _configuration["Facebook:AppId"];
            var appSecret = _configuration["Facebook:AppSecret"];

            var response = await _httpClient.GetAsync(
                $"{BaseUrl}/{GraphApiVersion}/oauth/access_token" +
                $"?client_id={appId}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUrl)}" +
                $"&client_secret={appSecret}" +
                $"&code={code}");

            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadFromJsonAsync<JsonElement>();
            return content.GetProperty("access_token").GetString() ?? string.Empty;
        }

        public async Task<List<FacebookPageDto>> GetPagesAsync(string userAccessToken)
        {
            var response = await _httpClient.GetAsync(
                $"{BaseUrl}/{GraphApiVersion}/me/accounts?access_token={userAccessToken}&limit=100");

            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadFromJsonAsync<JsonElement>();
            var data = content.GetProperty("data");
            
            var pages = new List<FacebookPageDto>();
            foreach (var item in data.EnumerateArray())
            {
                pages.Add(new FacebookPageDto
                {
                    Id = item.GetProperty("id").GetString() ?? "",
                    Name = item.GetProperty("name").GetString() ?? "",
                    AccessToken = item.GetProperty("access_token").GetString() ?? "",
                    Category = item.TryGetProperty("category", out var cat) ? cat.GetString() : null
                });
            }
            return pages;
        }

        public async Task<FacebookIntegration> ConnectPageAsync(Guid workspaceId, Guid userId, string pageId, string userAccessToken)
        {
            // 1. Get Page Details & Token
            var pages = await GetPagesAsync(userAccessToken);
            var page = pages.FirstOrDefault(p => p.Id == pageId);
            if (page == null) throw new Exception("Page not found or user does not have access");

            // 2. Subscribe App to Page Webhooks
            await SubscribeToWebhooksAsync(page.Id, page.AccessToken);

            // 3. Save to DB
            var existing = await _context.FacebookIntegrations
                .FirstOrDefaultAsync(f => f.WorkspaceId == workspaceId && f.PageId == pageId);

            if (existing != null)
            {
                existing.PageAccessToken = page.AccessToken;
                existing.UserAccessToken = userAccessToken;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.IsActive = true;
                existing.PageName = page.Name;
                await _context.SaveChangesAsync(default);
                return existing;
            }
            else
            {
                var integration = new FacebookIntegration
                {
                    WorkspaceId = workspaceId,
                    ConnectedByUserId = userId,
                    PageId = page.Id,
                    PageName = page.Name,
                    PageAccessToken = page.AccessToken,
                    UserAccessToken = userAccessToken,
                    ConnectedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                
                _context.FacebookIntegrations.Add(integration);
                await _context.SaveChangesAsync(default);
                return integration;
            }
        }

        public async Task<FacebookIntegration?> GetIntegrationAsync(Guid workspaceId)
        {
            return await _context.FacebookIntegrations
                .FirstOrDefaultAsync(f => f.WorkspaceId == workspaceId);
        }

        public async Task SubscribeToWebhooksAsync(string pageId, string pageAccessToken)
        {
            try
            {
                var content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "subscribed_fields", "leadgen" },
                    { "access_token", pageAccessToken }
                });

                var response = await _httpClient.PostAsync(
                    $"{BaseUrl}/{GraphApiVersion}/{pageId}/subscribed_apps", content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to subscribe page {pageId} to webhooks. Status: {response.StatusCode}. Error: {error}");
                    throw new Exception($"Facebook Webhook Subscription Failed: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception during webhook subscription for page {pageId}");
                throw; // Rethrow to let caller handle/expose it
            }
        }

        public async Task ProcessWebhookPayloadAsync(string payload)
        {
            // Simplified parsing - in prod use robust JSON parsing models
            var json = JsonDocument.Parse(payload);
            var root = json.RootElement;
            
            // Handle "object": "page"
            if (root.TryGetProperty("object", out var obj) && obj.GetString() == "page")
            {
                var entries = root.GetProperty("entry");
                foreach (var entry in entries.EnumerateArray())
                {
                    var changes = entry.GetProperty("changes");
                    foreach (var change in changes.EnumerateArray())
                    {
                        var field = change.GetProperty("field").GetString();
                        if (field != "leadgen") continue;

                        var value = change.GetProperty("value");
                        var leadgenId = value.GetProperty("leadgen_id").GetString();
                        var pageId = value.GetProperty("page_id").GetString();
                        var formId = value.GetProperty("form_id").GetString() ?? "";

                        if (!string.IsNullOrEmpty(leadgenId) && !string.IsNullOrEmpty(pageId))
                        {
                            await ProcessLeadAsync(leadgenId, pageId, formId);
                        }
                    }
                }
            }
        }

        private async Task ProcessLeadAsync(string leadgenId, string pageId, string formId)
        {
            // 1. Find integration to get token
            var integration = await _context.FacebookIntegrations
                .FirstOrDefaultAsync(f => f.PageId == pageId);

            if (integration == null || string.IsNullOrEmpty(integration.PageAccessToken))
            {
                _logger.LogWarning($"Received lead for unknown page {pageId}");
                return;
            }

            // 2. Fetch Lead Details from Graph API
            try 
            {
                var response = await _httpClient.GetAsync(
                    $"{BaseUrl}/{GraphApiVersion}/{leadgenId}?access_token={integration.PageAccessToken}");
                
                if (!response.IsSuccessStatusCode) {
                    _logger.LogError($"Failed to fetch lead {leadgenId}: {response.StatusCode}");
                    return;
                }

                var leadData = await response.Content.ReadFromJsonAsync<JsonElement>();
                var fieldData = leadData.GetProperty("field_data");

                // 3. Map to CreateLeadRequest
                var request = new CreateLeadRequest
                {
                    FirstName = "Facebook",
                    LastName = "Lead",
                    Email = "",
                    Source = "FACEBOOK",
                    UtmSource = "facebook",
                    UtmMedium = "cpc", 
                    UtmCampaign = formId // Store Form ID as campaign or created dedicated field
                };

                // Parse field_data array: [{name: "email", values: ["..."]}, ...]
                foreach (var field in fieldData.EnumerateArray())
                {
                    var name = field.GetProperty("name").GetString();
                    var values = field.GetProperty("values");
                    var val = values.GetArrayLength() > 0 ? values[0].GetString() : null;

                    if (string.IsNullOrEmpty(val) || name == null) continue;

                    switch (name.ToLower())
                    {
                        case "email": request.Email = val; break;
                        case "first_name": request.FirstName = val; break;
                        case "last_name": request.LastName = val; break;
                        case "full_name": 
                            var parts = val.Split(' ', 2);
                            request.FirstName = parts[0];
                            request.LastName = parts.Length > 1 ? parts[1] : "";
                            break;
                        case "phone_number": request.Phone = val; break;
                        case "company_name": request.CompanyName = val; break;
                    }
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                     request.Email = $"fb_{leadgenId}@example.com"; // Fallback if no email
                }

                // 4. Create Lead
                await _leadService.CreateLeadAsync(integration.WorkspaceId, integration.ConnectedByUserId, request);
                
                // Update stats
                integration.TotalLeadsSynced++;
                integration.LastSyncAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(default);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Facebook lead");
            }
        }
    }
}
