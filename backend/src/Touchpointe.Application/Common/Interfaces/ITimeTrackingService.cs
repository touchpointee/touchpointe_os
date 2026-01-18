using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITimeTrackingService
    {
        Task<TimeEntryDto> StartTimerAsync(Guid workspaceId, Guid taskId, Guid userId, StartTimerRequest request);
        Task<TimeEntryDto> StopTimerAsync(Guid workspaceId, Guid taskId, Guid userId);
        Task<TimeEntryDto> LogManualTimeAsync(Guid workspaceId, Guid taskId, Guid userId, ManualTimeRequest request);
        Task<List<TimeEntryDto>> GetTaskTimeEntriesAsync(Guid workspaceId, Guid taskId);
        Task<TimeEntryDto> UpdateEntryAsync(Guid workspaceId, Guid entryId, Guid userId, UpdateTimeEntryRequest request);
        Task DeleteEntryAsync(Guid workspaceId, Guid entryId, Guid userId);
        
        // Optional: Get active timer for user (global or task specific)
        Task<TimeEntryDto?> GetActiveTimerAsync(Guid workspaceId, Guid userId);
    }
}
