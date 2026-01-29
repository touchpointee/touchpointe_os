using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Services.Search
{
    public class SearchService : ISearchService
    {
        private readonly IApplicationDbContext _context;

        public SearchService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<SearchResultDto>> SearchAsync(Guid workspaceId, string query, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query)) return new List<SearchResultDto>();

            var q = query.ToLower();
            var results = new List<SearchResultDto>();

            // 1. Search Tasks
            var tasks = await _context.Tasks
                .Include(t => t.List)
                .Where(t => t.WorkspaceId == workspaceId && (t.Title.ToLower().Contains(q) || (t.Description != null && t.Description.ToLower().Contains(q))))
                .Take(10)
                .Select(t => new SearchResultDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Subtitle = $"Task in {t.List.Name}",
                    Type = "Task",
                    Url = $"/tasks/list/{t.ListId}"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(tasks);

            // 2. Search Leads
            var leads = await _context.Leads
                .Where(l => l.WorkspaceId == workspaceId && (l.FirstName.ToLower().Contains(q) || l.LastName.ToLower().Contains(q) || l.Email.ToLower().Contains(q)))
                .Take(5)
                .Select(l => new SearchResultDto
                {
                    Id = l.Id,
                    Title = $"{l.FirstName} {l.LastName}",
                    Subtitle = "Lead",
                    Type = "Lead",
                    Url = "/crm/leads"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(leads);

            // 3. Search Contacts
            var contacts = await _context.Contacts
                .Where(c => c.WorkspaceId == workspaceId && (c.FirstName.ToLower().Contains(q) || c.LastName.ToLower().Contains(q) || c.Email.ToLower().Contains(q)))
                .Take(5)
                .Select(c => new SearchResultDto
                {
                    Id = c.Id,
                    Title = $"{c.FirstName} {c.LastName}",
                    Subtitle = "Contact",
                    Type = "Contact",
                    Url = "/crm/contacts"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(contacts);

            // 4. Search Companies
            var companies = await _context.Companies
                .Where(c => c.WorkspaceId == workspaceId && c.Name.ToLower().Contains(q))
                .Take(5)
                .Select(c => new SearchResultDto
                {
                    Id = c.Id,
                    Title = c.Name,
                    Subtitle = "Company",
                    Type = "Company",
                    Url = "/crm/companies"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(companies);

            // 5. Search Deals
            var deals = await _context.Deals
                .Where(d => d.WorkspaceId == workspaceId && d.Name.ToLower().Contains(q))
                .Take(5)
                .Select(d => new SearchResultDto
                {
                    Id = d.Id,
                    Title = d.Name,
                    Subtitle = $"Deal - {d.Stage}",
                    Type = "Deal",
                    Url = "/crm/deals"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(deals);

            // 6. Search Channels
            var channels = await _context.Channels
                .Where(c => c.WorkspaceId == workspaceId && c.Name.ToLower().Contains(q))
                .Take(5)
                .Select(c => new SearchResultDto
                {
                    Id = c.Id,
                    Title = $"# {c.Name}",
                    Subtitle = "Channel",
                    Type = "Channel",
                    Url = $"/chat/channel/{c.Id}"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(channels);

            return results;
        }
    }
}
