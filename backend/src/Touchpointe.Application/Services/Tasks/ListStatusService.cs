using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Tasks
{
    public class ListStatusService
    {
        private readonly IApplicationDbContext _context;

        public ListStatusService(IApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all statuses for a list, ordered by Order.
        /// </summary>
        public async Task<List<ListStatusDto>> GetStatusesByListIdAsync(Guid listId)
        {
            var statuses = await _context.ListStatuses
                .Where(s => s.ListId == listId)
                .OrderBy(s => s.Order)
                .Select(s => new ListStatusDto(
                    s.Id,
                    s.ListId,
                    s.Name,
                    s.Color,
                    s.Category.ToString(),
                    s.Order
                ))
                .ToListAsync();

            return statuses;
        }

        /// <summary>
        /// Create default statuses for a new list.
        /// Called when a List is created.
        /// </summary>
        public async Task CreateDefaultStatusesAsync(Guid listId)
        {
            var defaultStatuses = new List<ListStatus>
            {
                new ListStatus
                {
                    ListId = listId,
                    Name = "To Do",
                    Color = "#6B7280",
                    Category = StatusCategory.NotStarted,
                    Order = 1
                },
                new ListStatus
                {
                    ListId = listId,
                    Name = "In Progress",
                    Color = "#2563EB",
                    Category = StatusCategory.Active,
                    Order = 2
                },
                new ListStatus
                {
                    ListId = listId,
                    Name = "In Review",
                    Color = "#F59E0B",
                    Category = StatusCategory.Active,
                    Order = 3
                },
                new ListStatus
                {
                    ListId = listId,
                    Name = "Done",
                    Color = "#16A34A",
                    Category = StatusCategory.Closed,
                    Order = 4
                }
            };

            _context.ListStatuses.AddRange(defaultStatuses);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        /// <summary>
        /// Update a status (name and/or color).
        /// </summary>
        public async Task<ListStatusDto?> UpdateStatusAsync(Guid workspaceId, Guid statusId, UpdateListStatusRequest request)
        {
            var status = await _context.ListStatuses
                .Include(s => s.List)
                .FirstOrDefaultAsync(s => s.Id == statusId && s.List.WorkspaceId == workspaceId);

            if (status == null)
                return null;

            if (request.Name != null)
                status.Name = request.Name;

            if (request.Color != null)
                status.Color = request.Color;

            await _context.SaveChangesAsync(CancellationToken.None);

            return new ListStatusDto(
                status.Id,
                status.ListId,
                status.Name,
                status.Color,
                status.Category.ToString(),
                status.Order
            );
        }

        /// <summary>
        /// Create a new status for a list.
        /// </summary>
        public async Task<ListStatusDto> CreateStatusAsync(Guid workspaceId, Guid listId, CreateListStatusRequest request)
        {
            // Verify the list belongs to the workspace
            var list = await _context.TaskLists
                .FirstOrDefaultAsync(l => l.Id == listId && l.WorkspaceId == workspaceId);

            if (list == null)
                throw new InvalidOperationException("List not found or doesn't belong to workspace");

            // Get max order value
            var maxOrder = await _context.ListStatuses
                .Where(s => s.ListId == listId)
                .MaxAsync(s => (int?)s.Order) ?? 0;

            var status = new ListStatus
            {
                ListId = listId,
                Name = request.Name,
                Color = request.Color,
                Category = Enum.TryParse<StatusCategory>(request.Category, true, out var cat) ? cat : StatusCategory.Active,
                Order = maxOrder + 1
            };

            _context.ListStatuses.Add(status);
            await _context.SaveChangesAsync(CancellationToken.None);

            return new ListStatusDto(
                status.Id,
                status.ListId,
                status.Name,
                status.Color,
                status.Category.ToString(),
                status.Order
            );
        }

        /// <summary>
        /// Delete a status.
        /// </summary>
        public async Task<bool> DeleteStatusAsync(Guid workspaceId, Guid statusId)
        {
            var status = await _context.ListStatuses
                .Include(s => s.List)
                .FirstOrDefaultAsync(s => s.Id == statusId && s.List.WorkspaceId == workspaceId);

            if (status == null)
                return false;

            _context.ListStatuses.Remove(status);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }
    }
}
