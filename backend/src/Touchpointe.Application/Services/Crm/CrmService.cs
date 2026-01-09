using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Crm
{
    public class CrmService : ICrmService
    {
        private readonly IApplicationDbContext _context;

        public CrmService(IApplicationDbContext context)
        {
            _context = context;
        }

        // --- Companies ---

        public async Task<List<CompanyDto>> GetCompaniesAsync(Guid workspaceId)
        {
            return await _context.Companies
                .Where(c => c.WorkspaceId == workspaceId)
                .OrderBy(c => c.Name)
                .Select(c => new CompanyDto(c.Id, c.WorkspaceId, c.Name, c.Domain, c.Industry, c.CreatedAt))
                .ToListAsync();
        }

        public async Task<CompanyDto> CreateCompanyAsync(Guid workspaceId, CreateCompanyRequest request)
        {
            var company = new Company
            {
                WorkspaceId = workspaceId,
                Name = request.Name,
                Domain = request.Domain,
                Industry = request.Industry
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(company);
        }

        public async Task<CompanyDto> UpdateCompanyAsync(Guid workspaceId, Guid companyId, UpdateCompanyRequest request)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.WorkspaceId == workspaceId);
            if (company == null) throw new Exception("Company not found");

            if (request.Name != null) company.Name = request.Name;
            if (request.Domain != null) company.Domain = request.Domain;
            if (request.Industry != null) company.Industry = request.Industry;

            await _context.SaveChangesAsync(CancellationToken.None);
            return MapToDto(company);
        }

        public async Task<bool> DeleteCompanyAsync(Guid workspaceId, Guid companyId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.WorkspaceId == workspaceId);
            if (company == null) return false;

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        // --- Contacts ---

        public async Task<List<ContactDto>> GetContactsAsync(Guid workspaceId)
        {
            var contacts = await _context.Contacts
                .Include(c => c.Company)
                .Where(c => c.WorkspaceId == workspaceId)
                .OrderBy(c => c.FirstName)
                .ToListAsync();

            return contacts.Select(c => MapToDto(c)).ToList();
        }

        public async Task<ContactDto> CreateContactAsync(Guid workspaceId, CreateContactRequest request)
        {
            var contact = new Contact
            {
                WorkspaceId = workspaceId,
                CompanyId = request.CompanyId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone
            };

            if (request.CompanyId.HasValue)
            {
                var exists = await _context.Companies.AnyAsync(c => c.Id == request.CompanyId && c.WorkspaceId == workspaceId);
                if (!exists) throw new Exception("Company not found in this workspace");
            }

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync(CancellationToken.None);

            // Re-fetch to include navigation properties
            if (request.CompanyId.HasValue)
            {
                contact = await _context.Contacts
                    .Include(c => c.Company)
                    .FirstAsync(c => c.Id == contact.Id);
            }
            
            return MapToDto(contact);
        }

        public async Task<ContactDto> UpdateContactAsync(Guid workspaceId, Guid contactId, UpdateContactRequest request)
        {
            var contact = await _context.Contacts
                .Include(c => c.Company)
                .FirstOrDefaultAsync(c => c.Id == contactId && c.WorkspaceId == workspaceId);
            
            if (contact == null) throw new Exception("Contact not found");

            if (request.FirstName != null) contact.FirstName = request.FirstName;
            if (request.LastName != null) contact.LastName = request.LastName;
            if (request.Email != null) contact.Email = request.Email;
            if (request.Phone != null) contact.Phone = request.Phone;
            
            if (request.CompanyId.HasValue) 
            {
                 if (request.CompanyId.Value != contact.CompanyId)
                 {
                    var exists = await _context.Companies.AnyAsync(c => c.Id == request.CompanyId.Value && c.WorkspaceId == workspaceId);
                    if (!exists) throw new Exception("Company not found in this workspace");
                    contact.CompanyId = request.CompanyId;
                 }
            }

            await _context.SaveChangesAsync(CancellationToken.None);
            
            // Re-fetch if company changed and we need new company name in DTO
            if (request.CompanyId.HasValue) 
            {
                 contact = await _context.Contacts
                    .Include(c => c.Company)
                    .FirstAsync(c => c.Id == contact.Id);
            }

            return MapToDto(contact);
        }

        public async Task<bool> DeleteContactAsync(Guid workspaceId, Guid contactId)
        {
            var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == contactId && c.WorkspaceId == workspaceId);
            if (contact == null) return false;
            
            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        // --- Deals ---

        public async Task<List<DealDto>> GetDealsAsync(Guid workspaceId)
        {
            var deals = await _context.Deals
                .Include(d => d.Company)
                .Include(d => d.DealContacts)
                    .ThenInclude(dc => dc.Contact)
                .Where(d => d.WorkspaceId == workspaceId)
                .OrderBy(d => d.Stage).ThenBy(d => d.OrderIndex)
                .ToListAsync();

            return deals.Select(d => MapToDto(d)).ToList();
        }

        public async Task<DealDto> CreateDealAsync(Guid workspaceId, Guid userId, CreateDealRequest request)
        {
            // Get max order index for stage
            var maxOrder = await _context.Deals
                .Where(d => d.WorkspaceId == workspaceId && d.Stage == request.Stage)
                .MaxAsync(d => (int?)d.OrderIndex) ?? 0;

            var deal = new Deal
            {
                WorkspaceId = workspaceId,
                CompanyId = request.CompanyId,
                Name = request.Name,
                Value = request.Value,
                Stage = request.Stage,
                CloseDate = request.CloseDate,
                OrderIndex = maxOrder + 1,
            };

            if (request.CompanyId.HasValue && !await _context.Companies.AnyAsync(c => c.Id == request.CompanyId && c.WorkspaceId == workspaceId))
                 throw new Exception("Company not found");

            if (request.ContactIds != null && request.ContactIds.Any())
            {
                var validContacts = await _context.Contacts
                    .Where(c => request.ContactIds.Contains(c.Id) && c.WorkspaceId == workspaceId)
                    .Select(c => c.Id)
                    .ToListAsync();
                
                foreach (var cid in validContacts)
                {
                    deal.DealContacts.Add(new DealContact { ContactId = cid });
                }
            }

            _context.Deals.Add(deal);
            
            _context.CrmActivities.Add(new CrmActivity
            {
                WorkspaceId = workspaceId,
                EntityType = CrmEntityType.DEAL,
                EntityId = deal.Id,
                ActionType = CrmActionType.CREATED,
                NewValue = deal.Name,
                UserId = userId
            });

            await _context.SaveChangesAsync(CancellationToken.None);
            
            // Re-fetch
            deal = await _context.Deals
                .Include(d => d.Company)
                .Include(d => d.DealContacts)
                    .ThenInclude(dc => dc.Contact)
                .FirstAsync(d => d.Id == deal.Id);

            return MapToDto(deal);
        }

        public async Task<DealDto> UpdateDealAsync(Guid workspaceId, Guid userId, Guid dealId, UpdateDealRequest request)
        {
            var deal = await _context.Deals
                .Include(d => d.Company)
                .Include(d => d.DealContacts)
                .FirstOrDefaultAsync(d => d.Id == dealId && d.WorkspaceId == workspaceId);

            if (deal == null) throw new Exception("Deal not found");

            if (request.Name != null) deal.Name = request.Name;
            
            if (request.Value.HasValue && deal.Value != request.Value.Value)
            {
                _context.CrmActivities.Add(new CrmActivity
                {
                    WorkspaceId = workspaceId,
                    EntityType = CrmEntityType.DEAL,
                    EntityId = deal.Id,
                    ActionType = CrmActionType.VALUE_CHANGED,
                    OldValue = deal.Value.ToString(),
                    NewValue = request.Value.Value.ToString(),
                    UserId = userId
                });
                deal.Value = request.Value.Value;
            }

            if (request.CloseDate.HasValue) deal.CloseDate = request.CloseDate.Value;

            if (request.CompanyId.HasValue && deal.CompanyId != request.CompanyId)
            {
                 if (!await _context.Companies.AnyAsync(c => c.Id == request.CompanyId && c.WorkspaceId == workspaceId))
                     throw new Exception("Company not found");

                _context.CrmActivities.Add(new CrmActivity
                {
                    WorkspaceId = workspaceId,
                    EntityType = CrmEntityType.DEAL,
                    EntityId = deal.Id,
                    ActionType = CrmActionType.LINKED,
                    OldValue = deal.CompanyId?.ToString(),
                    NewValue = request.CompanyId.ToString(),
                    UserId = userId
                });
                deal.CompanyId = request.CompanyId;
            }

            if (request.ContactIds != null)
            {
                // Remove existing
                _context.DealContacts.RemoveRange(deal.DealContacts);
                deal.DealContacts.Clear();

                // Add new
                var validContacts = await _context.Contacts
                    .Where(c => request.ContactIds.Contains(c.Id) && c.WorkspaceId == workspaceId)
                    .Select(c => c.Id)
                    .ToListAsync();
                
                foreach (var cid in validContacts)
                {
                    deal.DealContacts.Add(new DealContact { DealId = deal.Id, ContactId = cid });
                }

                _context.CrmActivities.Add(new CrmActivity
                {
                    WorkspaceId = workspaceId,
                    EntityType = CrmEntityType.DEAL,
                    EntityId = deal.Id,
                    ActionType = CrmActionType.LINKED,
                    OldValue = "Contacts Updated",
                    NewValue = $"{validContacts.Count} contacts",
                    UserId = userId
                });
            }

            await _context.SaveChangesAsync(CancellationToken.None);
            
             // Re-fetch mostly for links names
            deal = await _context.Deals
                .Include(d => d.Company)
                .Include(d => d.DealContacts)
                    .ThenInclude(dc => dc.Contact)
                .FirstAsync(d => d.Id == deal.Id);

            return MapToDto(deal);
        }

        public async Task<DealDto> UpdateDealStageAsync(Guid workspaceId, Guid userId, Guid dealId, UpdateDealStageRequest request)
        {
            var deal = await _context.Deals
                .Include(d => d.Company)
                .Include(d => d.DealContacts)
                    .ThenInclude(dc => dc.Contact)
                .FirstOrDefaultAsync(d => d.Id == dealId && d.WorkspaceId == workspaceId);

            if (deal == null) throw new Exception("Deal not found");

            if (deal.Stage != request.Stage)
            {
                _context.CrmActivities.Add(new CrmActivity
                {
                    WorkspaceId = workspaceId,
                    EntityType = CrmEntityType.DEAL,
                    EntityId = deal.Id,
                    ActionType = CrmActionType.STAGE_CHANGED,
                    OldValue = deal.Stage.ToString(),
                    NewValue = request.Stage.ToString(),
                    UserId = userId
                });
                deal.Stage = request.Stage;
            }

            deal.OrderIndex = request.OrderIndex;

            await _context.SaveChangesAsync(CancellationToken.None);
            return MapToDto(deal);
        }

        public async Task<bool> DeleteDealAsync(Guid workspaceId, Guid dealId)
        {
            var deal = await _context.Deals.FirstOrDefaultAsync(d => d.Id == dealId && d.WorkspaceId == workspaceId);
            if (deal == null) return false;

            _context.Deals.Remove(deal);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        public async Task<List<CrmActivityDto>> GetActivitiesAsync(Guid workspaceId, Guid? entityId = null, string? entityType = null)
        {
            var query = _context.CrmActivities
                .Include(a => a.User)
                .Where(a => a.WorkspaceId == workspaceId);
            
            if (entityId.HasValue)
            {
                query = query.Where(a => a.EntityId == entityId.Value);
            }

            if (entityType != null && Enum.TryParse<CrmEntityType>(entityType, true, out var typeEnum))
            {
                query = query.Where(a => a.EntityType == typeEnum);
            }

            var activities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(50)
                .ToListAsync();

            return activities.Select(a => new CrmActivityDto(
                a.Id,
                a.WorkspaceId,
                a.EntityType.ToString(),
                a.EntityId,
                a.ActionType.ToString(),
                a.OldValue,
                a.NewValue,
                a.UserId,
                a.User.FullName,
                a.CreatedAt
            )).ToList();
        }

        // --- Mappers ---

        private static CompanyDto MapToDto(Company c)
        {
            return new CompanyDto(c.Id, c.WorkspaceId, c.Name, c.Domain, c.Industry, c.CreatedAt);
        }

        private static ContactDto MapToDto(Contact c)
        {
            return new ContactDto(
                c.Id, 
                c.WorkspaceId, 
                c.CompanyId, 
                c.Company?.Name ?? "", 
                c.FirstName, 
                c.LastName, 
                c.FullName, 
                c.Email, 
                c.Phone, 
                c.CreatedAt
            );
        }

        private static DealDto MapToDto(Deal d)
        {
            var contacts = d.DealContacts?.Select(dc => dc.Contact).Where(c => c != null).ToList() ?? new List<Contact>();
            var contactDtos = contacts.Select(c => MapToDto(c)).ToList();

            return new DealDto(
                d.Id,
                d.WorkspaceId,
                d.CompanyId,
                d.Company?.Name ?? "",
                contactDtos,
                string.Join(", ", contacts.Select(c => c.FullName)),
                d.Name,
                d.Value,
                d.Stage.ToString(),
                d.CloseDate,
                d.OrderIndex,
                d.CreatedAt
            );
        }
    }
}
