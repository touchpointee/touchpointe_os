using System;
using System.Collections.Generic;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    // --- DTOs ---

    public record CompanyDto(
        Guid Id,
        Guid WorkspaceId,
        string Name,
        string Domain,
        string Industry,
        DateTime CreatedAt
    );

    public record ContactDto(
        Guid Id,
        Guid WorkspaceId,
        Guid? CompanyId,
        string CompanyName, // Computed
        string FirstName,
        string LastName,
        string FullName,
        string Email,
        string Phone,
        DateTime CreatedAt
    );

    public record DealDto(
        Guid Id,
        Guid WorkspaceId,
        Guid? CompanyId,
        string CompanyName,
        List<ContactDto> Contacts, // Changed from single ContactId
        string ContactNames,       // Computed: "John Doe, Jane Smith"
        string Name,
        decimal Value,
        string Stage, // Enum as string
        DateTime? CloseDate,
        int OrderIndex,
        DateTime CreatedAt
    );

    public record CrmActivityDto(
        Guid Id,
        Guid WorkspaceId,
        string EntityType,
        Guid EntityId,
        string ActionType,
        string? OldValue,
        string? NewValue,
        Guid UserId,
        string UserName,
        DateTime CreatedAt
    );

    // --- Requests ---

    // Company Requests
    public record CreateCompanyRequest(string Name, string Domain, string Industry);
    public record UpdateCompanyRequest(string? Name, string? Domain, string? Industry);

    // Contact Requests
    public record CreateContactRequest(Guid? CompanyId, string FirstName, string LastName, string Email, string Phone);
    public record UpdateContactRequest(Guid? CompanyId, string? FirstName, string? LastName, string? Email, string? Phone);

    // Deal Requests
    public record CreateDealRequest(Guid? CompanyId, List<Guid>? ContactIds, string Name, decimal Value, DealStage Stage, DateTime? CloseDate);
    public record UpdateDealRequest(Guid? CompanyId, List<Guid>? ContactIds, string? Name, decimal? Value, DateTime? CloseDate);
    public record UpdateDealStageRequest(DealStage Stage, int OrderIndex);
}
