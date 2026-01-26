using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Leads
{
    public class LeadService : ILeadService
    {
        private readonly IApplicationDbContext _context;

        public LeadService(IApplicationDbContext context)
        {
            _context = context;
        }

        // ========== LEADS CRUD ==========

        public async Task<List<LeadDto>> GetLeadsAsync(Guid workspaceId, string? status = null, string? source = null)
        {
            var query = _context.Leads
                .Where(l => l.WorkspaceId == workspaceId)
                .Include(l => l.Form)
                .Include(l => l.AssignedTo)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeadStatus>(status, out var leadStatus))
            {
                query = query.Where(l => l.Status == leadStatus);
            }

            if (!string.IsNullOrEmpty(source) && Enum.TryParse<LeadSource>(source, out var leadSource))
            {
                query = query.Where(l => l.Source == leadSource);
            }

            var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

            return leads.Select(MapToDto).ToList();
        }

        public async Task<LeadDto?> GetLeadByIdAsync(Guid workspaceId, Guid leadId)
        {
            var lead = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId && l.Id == leadId)
                .Include(l => l.Form)
                .Include(l => l.AssignedTo)
                .FirstOrDefaultAsync();

            return lead != null ? MapToDto(lead) : null;
        }

        public async Task<LeadDto> CreateLeadAsync(Guid workspaceId, Guid? userId, CreateLeadRequest request)
        {
            var source = LeadSource.MANUAL;
            if (!string.IsNullOrEmpty(request.Source) && Enum.TryParse<LeadSource>(request.Source, out var parsedSource))
            {
                source = parsedSource;
            }

            var lead = new Lead
            {
                WorkspaceId = workspaceId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                CompanyName = request.CompanyName,
                Source = source,
                Notes = request.Notes,
                AssignedToUserId = request.AssignedToUserId,
                UtmSource = request.UtmSource,
                UtmMedium = request.UtmMedium,
                UtmCampaign = request.UtmCampaign,
                Score = CalculateInitialScore(source)
            };

            _context.Leads.Add(lead);

            // Add activity
            var activity = new LeadActivity
            {
                LeadId = lead.Id,
                UserId = userId,
                Type = LeadActivityType.CREATED,
                Description = $"Lead created from {source}",
                ScoreChange = lead.Score
            };
            _context.LeadActivities.Add(activity);

            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(lead);
        }

        public async Task<LeadDto> UpdateLeadAsync(Guid workspaceId, Guid leadId, Guid userId, UpdateLeadRequest request)
        {
            var lead = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId && l.Id == leadId)
                .FirstOrDefaultAsync();

            if (lead == null) throw new Exception("Lead not found");

            var oldStatus = lead.Status;

            if (request.FirstName != null) lead.FirstName = request.FirstName;
            if (request.LastName != null) lead.LastName = request.LastName;
            if (request.Email != null) lead.Email = request.Email;
            if (request.Phone != null) lead.Phone = request.Phone;
            if (request.CompanyName != null) lead.CompanyName = request.CompanyName;
            if (request.Notes != null) lead.Notes = request.Notes;
            if (request.AssignedToUserId.HasValue) lead.AssignedToUserId = request.AssignedToUserId;

            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<LeadStatus>(request.Status, out var newStatus))
            {
                if (oldStatus != newStatus)
                {
                    lead.Status = newStatus;
                    
                    var activity = new LeadActivity
                    {
                        LeadId = lead.Id,
                        UserId = userId,
                        Type = LeadActivityType.STATUS_CHANGED,
                        Description = $"Status changed from {oldStatus} to {newStatus}",
                        OldValue = oldStatus.ToString(),
                        NewValue = newStatus.ToString(),
                        ScoreChange = newStatus == LeadStatus.CONTACTED ? 15 : 0
                    };
                    _context.LeadActivities.Add(activity);

                    if (newStatus == LeadStatus.CONTACTED)
                    {
                        lead.Score += 15;
                    }
                }
            }

            lead.UpdatedAt = DateTime.UtcNow;
            lead.LastActivityAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(lead);
        }

        public async Task<bool> DeleteLeadAsync(Guid workspaceId, Guid leadId)
        {
            var lead = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId && l.Id == leadId)
                .FirstOrDefaultAsync();

            if (lead == null) return false;

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync(CancellationToken.None);

            return true;
        }

        public async Task<ConvertLeadResponse> ConvertLeadAsync(Guid workspaceId, Guid leadId, Guid userId, ConvertLeadRequest request)
        {
            var lead = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId && l.Id == leadId)
                .FirstOrDefaultAsync();

            if (lead == null) throw new Exception("Lead not found");
            if (lead.Status == LeadStatus.CONVERTED) throw new Exception("Lead already converted");

            var response = new ConvertLeadResponse();

            // Create Company if requested
            Guid? companyId = null;
            if (request.CreateCompany && !string.IsNullOrEmpty(lead.CompanyName))
            {
                var company = new Company
                {
                    WorkspaceId = workspaceId,
                    Name = lead.CompanyName
                };
                _context.Companies.Add(company);
                companyId = company.Id;
                response.CompanyId = company.Id;
            }

            // Create Contact
            var contact = new Contact
            {
                WorkspaceId = workspaceId,
                FirstName = lead.FirstName,
                LastName = lead.LastName,
                Email = lead.Email,
                Phone = lead.Phone ?? "",
                CompanyId = companyId
            };
            _context.Contacts.Add(contact);
            response.ContactId = contact.Id;

            // Create Deal if requested
            if (request.CreateDeal)
            {
                var deal = new Deal
                {
                    WorkspaceId = workspaceId,
                    Name = request.DealName ?? $"Deal with {lead.FullName}",
                    Value = request.DealValue ?? 0,
                    Stage = DealStage.NEW,
                    CompanyId = companyId
                };
                _context.Deals.Add(deal);
                response.DealId = deal.Id;

                // Link contact to deal
                var dealContact = new DealContact
                {
                    DealId = deal.Id,
                    ContactId = contact.Id
                };
                _context.DealContacts.Add(dealContact);
            }

            // Update lead status
            lead.Status = LeadStatus.CONVERTED;
            lead.ConvertedToContactId = contact.Id;
            lead.UpdatedAt = DateTime.UtcNow;

            // Add activity
            var activity = new LeadActivity
            {
                LeadId = lead.Id,
                UserId = userId,
                Type = LeadActivityType.CONVERTED,
                Description = $"Lead converted to contact"
            };
            _context.LeadActivities.Add(activity);

            await _context.SaveChangesAsync(CancellationToken.None);

            return response;
        }

        // ========== LEAD FORMS ==========

        public async Task<List<LeadFormDto>> GetFormsAsync(Guid workspaceId)
        {
            var forms = await _context.LeadForms
                .Where(f => f.WorkspaceId == workspaceId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return forms.Select(MapFormToDto).ToList();
        }

        public async Task<LeadFormDto?> GetFormByIdAsync(Guid workspaceId, Guid formId)
        {
            var form = await _context.LeadForms
                .Where(f => f.WorkspaceId == workspaceId && f.Id == formId)
                .FirstOrDefaultAsync();

            return form != null ? MapFormToDto(form) : null;
        }

        public async Task<LeadFormDto?> GetFormByTokenAsync(string token)
        {
            var form = await _context.LeadForms
                .Where(f => f.Token == token && f.IsActive)
                .FirstOrDefaultAsync();

            return form != null ? MapFormToDto(form) : null;
        }

        public async Task<LeadFormDto> CreateFormAsync(Guid workspaceId, Guid userId, CreateLeadFormRequest request)
        {
            var form = new LeadForm
            {
                WorkspaceId = workspaceId,
                CreatedByUserId = userId,
                Name = request.Name,
                Description = request.Description,
                FieldsConfig = request.FieldsConfig?.ToString() ?? "{}",
                SuccessRedirectUrl = request.SuccessRedirectUrl,
                SuccessMessage = request.SuccessMessage ?? "Thank you for your submission!"
            };

            _context.LeadForms.Add(form);
            await _context.SaveChangesAsync(CancellationToken.None);

            return MapFormToDto(form);
        }

        public async Task<LeadFormDto> UpdateFormAsync(Guid workspaceId, Guid formId, UpdateLeadFormRequest request)
        {
            var form = await _context.LeadForms
                .Where(f => f.WorkspaceId == workspaceId && f.Id == formId)
                .FirstOrDefaultAsync();

            if (form == null) throw new Exception("Form not found");

            if (request.Name != null) form.Name = request.Name;
            if (request.Description != null) form.Description = request.Description;
            if (request.FieldsConfig != null) form.FieldsConfig = request.FieldsConfig.ToString() ?? "{}";
            if (request.SuccessRedirectUrl != null) form.SuccessRedirectUrl = request.SuccessRedirectUrl;
            if (request.SuccessMessage != null) form.SuccessMessage = request.SuccessMessage;
            if (request.IsActive.HasValue) form.IsActive = request.IsActive.Value;

            form.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(CancellationToken.None);

            return MapFormToDto(form);
        }

        public async Task<bool> DeleteFormAsync(Guid workspaceId, Guid formId)
        {
            var form = await _context.LeadForms
                .Where(f => f.WorkspaceId == workspaceId && f.Id == formId)
                .FirstOrDefaultAsync();

            if (form == null) return false;

            _context.LeadForms.Remove(form);
            await _context.SaveChangesAsync(CancellationToken.None);

            return true;
        }

        public async Task<LeadDto> SubmitFormAsync(string token, PublicFormSubmitRequest request)
        {
            var form = await _context.LeadForms
                .Where(f => f.Token == token && f.IsActive)
                .FirstOrDefaultAsync();

            if (form == null) throw new Exception("Form not found or inactive");

            var lead = new Lead
            {
                WorkspaceId = form.WorkspaceId,
                FormId = form.Id,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                CompanyName = request.CompanyName,
                Source = LeadSource.FORM,
                UtmSource = request.UtmSource,
                UtmMedium = request.UtmMedium,
                UtmCampaign = request.UtmCampaign,
                Score = CalculateInitialScore(LeadSource.FORM)
            };

            _context.Leads.Add(lead);

            // Update form submission count
            form.SubmissionCount += 1;

            // Add activity
            var activity = new LeadActivity
            {
                LeadId = lead.Id,
                Type = LeadActivityType.CREATED,
                Description = $"Lead captured via form: {form.Name}",
                ScoreChange = lead.Score
            };
            _context.LeadActivities.Add(activity);

            await _context.SaveChangesAsync(CancellationToken.None);

            return MapToDto(lead);
        }

        // ========== ACTIVITIES ==========

        public async Task<List<LeadActivityDto>> GetLeadActivitiesAsync(Guid workspaceId, Guid leadId)
        {
            var activities = await _context.LeadActivities
                .Where(a => a.LeadId == leadId)
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return activities.Select(a => new LeadActivityDto
            {
                Id = a.Id,
                LeadId = a.LeadId,
                UserId = a.UserId,
                UserName = a.User?.FullName,
                Type = a.Type.ToString(),
                Description = a.Description,
                ScoreChange = a.ScoreChange,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        // ========== DASHBOARD ==========

        public async Task<CrmDashboardSummary> GetDashboardSummaryAsync(Guid workspaceId)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var leads = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId)
                .ToListAsync();

            var deals = await _context.Deals
                .Where(d => d.WorkspaceId == workspaceId)
                .ToListAsync();

            var total = leads.Count;
            var converted = leads.Count(l => l.Status == LeadStatus.CONVERTED);

            return new CrmDashboardSummary
            {
                TotalLeads = total,
                NewLeadsThisMonth = leads.Count(l => l.CreatedAt >= startOfMonth),
                QualifiedLeads = leads.Count(l => l.Status == LeadStatus.QUALIFIED),
                ConvertedLeads = converted,
                ConversionRate = total > 0 ? Math.Round((decimal)converted / total * 100, 1) : 0,
                HotLeads = leads.Count(l => l.Score >= 60),
                TotalPipelineValue = deals.Where(d => d.Stage != DealStage.CLOSED_LOST).Sum(d => d.Value)
            };
        }

        public async Task<List<LeadsBySourceDto>> GetLeadsBySourceAsync(Guid workspaceId)
        {
            var leads = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId)
                .ToListAsync();

            var total = leads.Count;

            return leads
                .GroupBy(l => l.Source)
                .Select(g => new LeadsBySourceDto
                {
                    Source = g.Key.ToString(),
                    Count = g.Count(),
                    Percentage = total > 0 ? Math.Round((decimal)g.Count() / total * 100, 1) : 0
                })
                .OrderByDescending(x => x.Count)
                .ToList();
        }

        public async Task<ConversionFunnelDto> GetConversionFunnelAsync(Guid workspaceId)
        {
            var leads = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId)
                .ToListAsync();

            return new ConversionFunnelDto
            {
                New = leads.Count(l => l.Status == LeadStatus.NEW),
                Contacted = leads.Count(l => l.Status == LeadStatus.CONTACTED),
                Qualified = leads.Count(l => l.Status == LeadStatus.QUALIFIED),
                Converted = leads.Count(l => l.Status == LeadStatus.CONVERTED)
            };
        }

        // ========== SCORING ==========

        public async Task<int> CalculateLeadScoreAsync(Guid leadId)
        {
            var lead = await _context.Leads.FindAsync(leadId);
            return lead?.Score ?? 0;
        }

        public async Task UpdateLeadScoreAsync(Guid leadId, int scoreChange, string reason)
        {
            var lead = await _context.Leads.FindAsync(leadId);
            if (lead == null) return;

            lead.Score = Math.Max(0, Math.Min(100, lead.Score + scoreChange));
            lead.UpdatedAt = DateTime.UtcNow;

            var activity = new LeadActivity
            {
                LeadId = leadId,
                Type = LeadActivityType.SCORE_CHANGED,
                Description = reason,
                ScoreChange = scoreChange
            };
            _context.LeadActivities.Add(activity);

            await _context.SaveChangesAsync(CancellationToken.None);
        }

        // ========== HELPERS ==========

        private static int CalculateInitialScore(LeadSource source)
        {
            return source switch
            {
                LeadSource.FACEBOOK => 15,
                LeadSource.GOOGLE => 15,
                LeadSource.FORM => 10,
                LeadSource.REFERRAL => 20,
                LeadSource.ZAPIER => 10,
                _ => 5
            };
        }

        private static LeadDto MapToDto(Lead lead)
        {
            return new LeadDto
            {
                Id = lead.Id,
                WorkspaceId = lead.WorkspaceId,
                FormId = lead.FormId,
                FormName = lead.Form?.Name,
                AssignedToUserId = lead.AssignedToUserId,
                AssignedToName = lead.AssignedTo?.FullName,
                ConvertedToContactId = lead.ConvertedToContactId,
                FirstName = lead.FirstName,
                LastName = lead.LastName,
                FullName = lead.FullName,
                Email = lead.Email,
                Phone = lead.Phone,
                CompanyName = lead.CompanyName,
                Source = lead.Source.ToString(),
                Status = lead.Status.ToString(),
                Score = lead.Score,
                Notes = lead.Notes,
                UtmSource = lead.UtmSource,
                UtmMedium = lead.UtmMedium,
                UtmCampaign = lead.UtmCampaign,
                CreatedAt = lead.CreatedAt,
                LastActivityAt = lead.LastActivityAt
            };
        }

        private static LeadFormDto MapFormToDto(LeadForm form)
        {
            return new LeadFormDto
            {
                Id = form.Id,
                WorkspaceId = form.WorkspaceId,
                Name = form.Name,
                Token = form.Token,
                Description = form.Description,
                FieldsConfig = form.FieldsConfig,
                SuccessRedirectUrl = form.SuccessRedirectUrl,
                SuccessMessage = form.SuccessMessage,
                IsActive = form.IsActive,
                SubmissionCount = form.SubmissionCount,
                CreatedAt = form.CreatedAt
            };
        }
    }
}
