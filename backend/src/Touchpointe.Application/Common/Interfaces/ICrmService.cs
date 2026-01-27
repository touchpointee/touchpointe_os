using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ICrmService
    {
        // Company
        Task<List<CompanyDto>> GetCompaniesAsync(Guid workspaceId);
        Task<CompanyDto> CreateCompanyAsync(Guid workspaceId, CreateCompanyRequest request);
        Task<CompanyDto> UpdateCompanyAsync(Guid workspaceId, Guid companyId, UpdateCompanyRequest request);
        Task<bool> DeleteCompanyAsync(Guid workspaceId, Guid companyId);

        // Contact
        Task<List<ContactDto>> GetContactsAsync(Guid workspaceId);
        Task<ContactDto> CreateContactAsync(Guid workspaceId, CreateContactRequest request);
        Task<ContactDto> UpdateContactAsync(Guid workspaceId, Guid contactId, UpdateContactRequest request);
        Task<bool> DeleteContactAsync(Guid workspaceId, Guid contactId);

        // Deal
        Task<List<DealDto>> GetDealsAsync(Guid workspaceId);
        Task<DealDto> CreateDealAsync(Guid workspaceId, Guid userId, CreateDealRequest request);
        Task<DealDto> UpdateDealAsync(Guid workspaceId, Guid userId, Guid dealId, UpdateDealRequest request);
        Task<DealDto> UpdateDealStageAsync(Guid workspaceId, Guid userId, Guid dealId, UpdateDealStageRequest request);
        Task<bool> DeleteDealAsync(Guid workspaceId, Guid dealId);

        // Activity
        Task<List<CrmActivityDto>> GetActivitiesAsync(Guid workspaceId, Guid? entityId = null, string? entityType = null);

        // Comments
        Task<List<DealCommentDto>> GetDealCommentsAsync(Guid workspaceId, Guid dealId);
        Task<DealCommentDto> AddDealCommentAsync(Guid workspaceId, Guid userId, Guid dealId, string content);
        Task<bool> DeleteDealCommentAsync(Guid workspaceId, Guid userId, Guid commentId);
    }
}
