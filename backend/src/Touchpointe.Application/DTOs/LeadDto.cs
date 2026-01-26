using System;
using System.Collections.Generic;

namespace Touchpointe.Application.DTOs
{
    // ========== LEAD DTOs ==========
    
    public class LeadDto
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public Guid? FormId { get; set; }
        public string? FormName { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid? ConvertedToContactId { get; set; }
        
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }
        
        public string Source { get; set; } = "MANUAL";
        public string Status { get; set; } = "NEW";
        public int Score { get; set; }
        public string? Notes { get; set; }
        
        public string? UtmSource { get; set; }
        public string? UtmMedium { get; set; }
        public string? UtmCampaign { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? LastActivityAt { get; set; }
    }

    public class CreateLeadRequest
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? UtmSource { get; set; }
        public string? UtmMedium { get; set; }
        public string? UtmCampaign { get; set; }
    }

    public class UpdateLeadRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }

    public class ConvertLeadRequest
    {
        public bool CreateCompany { get; set; } = false;
        public bool CreateDeal { get; set; } = false;
        public string? DealName { get; set; }
        public decimal? DealValue { get; set; }
    }

    public class ConvertLeadResponse
    {
        public Guid ContactId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? DealId { get; set; }
    }

    // ========== LEAD FORM DTOs ==========

    public class LeadFormDto
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string? Description { get; set; }
        public object? FieldsConfig { get; set; }
        public string? SuccessRedirectUrl { get; set; }
        public string SuccessMessage { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int SubmissionCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLeadFormRequest
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public object? FieldsConfig { get; set; }
        public string? SuccessRedirectUrl { get; set; }
        public string? SuccessMessage { get; set; }
    }

    public class UpdateLeadFormRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public object? FieldsConfig { get; set; }
        public string? SuccessRedirectUrl { get; set; }
        public string? SuccessMessage { get; set; }
        public bool? IsActive { get; set; }
    }

    public class PublicFormSubmitRequest
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }
        public string? UtmSource { get; set; }
        public string? UtmMedium { get; set; }
        public string? UtmCampaign { get; set; }
        public Dictionary<string, string>? CustomFields { get; set; }
    }

    // ========== LEAD ACTIVITY DTOs ==========

    public class LeadActivityDto
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ScoreChange { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ========== DASHBOARD DTOs ==========

    public class CrmDashboardSummary
    {
        public int TotalLeads { get; set; }
        public int NewLeadsThisMonth { get; set; }
        public int QualifiedLeads { get; set; }
        public int ConvertedLeads { get; set; }
        public decimal ConversionRate { get; set; }
        public int HotLeads { get; set; }
        public decimal TotalPipelineValue { get; set; }
    }

    public class LeadsBySourceDto
    {
        public string Source { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class ConversionFunnelDto
    {
        public int New { get; set; }
        public int Contacted { get; set; }
        public int Qualified { get; set; }
        public int Converted { get; set; }
    }
}
