using System;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardDataDto> GetDashboardDataAsync(Guid workspaceId, Guid userId);
    }
}
