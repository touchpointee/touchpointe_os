using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ILeadService
    {
        // Leads CRUD
        Task<List<LeadDto>> GetLeadsAsync(Guid workspaceId, string? status = null, string? source = null);
        Task<LeadDto?> GetLeadByIdAsync(Guid workspaceId, Guid leadId);
        Task<LeadDto> CreateLeadAsync(Guid workspaceId, Guid? userId, CreateLeadRequest request);
        Task<LeadDto> UpdateLeadAsync(Guid workspaceId, Guid leadId, Guid userId, UpdateLeadRequest request);
        Task<bool> DeleteLeadAsync(Guid workspaceId, Guid leadId);
        Task<ConvertLeadResponse> ConvertLeadAsync(Guid workspaceId, Guid leadId, Guid userId, ConvertLeadRequest request);
        
        // Lead Forms
        Task<List<LeadFormDto>> GetFormsAsync(Guid workspaceId);
        Task<LeadFormDto?> GetFormByIdAsync(Guid workspaceId, Guid formId);
        Task<LeadFormDto?> GetFormByTokenAsync(string token);
        Task<LeadFormDto> CreateFormAsync(Guid workspaceId, Guid userId, CreateLeadFormRequest request);
        Task<LeadFormDto> UpdateFormAsync(Guid workspaceId, Guid formId, UpdateLeadFormRequest request);
        Task<bool> DeleteFormAsync(Guid workspaceId, Guid formId);
        Task<LeadDto> SubmitFormAsync(string token, PublicFormSubmitRequest request);
        
        // Activities
        Task<List<LeadActivityDto>> GetLeadActivitiesAsync(Guid workspaceId, Guid leadId);
        
        // Dashboard
        Task<CrmDashboardSummary> GetDashboardSummaryAsync(Guid workspaceId);
        Task<List<LeadsBySourceDto>> GetLeadsBySourceAsync(Guid workspaceId);
        Task<ConversionFunnelDto> GetConversionFunnelAsync(Guid workspaceId);
        
        // Scoring
        Task<int> CalculateLeadScoreAsync(Guid leadId);
        Task UpdateLeadScoreAsync(Guid leadId, int scoreChange, string reason);
    }
}
