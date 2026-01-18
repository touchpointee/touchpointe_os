using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services
{
    public class TimeTrackingService : ITimeTrackingService
    {
        private readonly IApplicationDbContext _context;

        public TimeTrackingService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TimeEntryDto> StartTimerAsync(Guid workspaceId, Guid taskId, Guid userId, StartTimerRequest request)
        {
            // 1. Check if user already has an active timer for this task (or any task?)
            // For now, let's enforce single global timer logic: Stop any existing running timer for this user
            var activeTimer = await _context.TaskTimeEntries
                .FirstOrDefaultAsync(t => t.UserId == userId && t.EndTime == null);

            if (activeTimer != null)
            {
                // Stop it
                activeTimer.EndTime = DateTime.UtcNow;
                activeTimer.DurationSeconds = (int)(activeTimer.EndTime.Value - activeTimer.StartTime!.Value).TotalSeconds;
            }

            // 2. Create new timer
            var newTimer = new TaskTimeEntry
            {
                WorkspaceId = workspaceId,
                TaskId = taskId,
                UserId = userId,
                StartTime = DateTime.UtcNow,
                EndTime = null,
                DurationSeconds = 0,
                Description = request.Description,
                IsManual = false
            };

            _context.TaskTimeEntries.Add(newTimer);
            await _context.SaveChangesAsync(default);

            // Load User for DTO
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            newTimer.User = user!;

            return MapToDto(newTimer);
        }

        public async Task<TimeEntryDto> StopTimerAsync(Guid workspaceId, Guid taskId, Guid userId)
        {
            var activeTimer = await _context.TaskTimeEntries
                .Include(t => t.User)
                .Where(t => t.WorkspaceId == workspaceId && t.TaskId == taskId && t.UserId == userId && t.EndTime == null)
                .OrderByDescending(t => t.StartTime)
                .FirstOrDefaultAsync();

            if (activeTimer == null)
            {
                throw new Exception("No active timer found for this task.");
            }

            activeTimer.EndTime = DateTime.UtcNow;
            if (activeTimer.StartTime.HasValue) 
            {
                activeTimer.DurationSeconds = (int)(activeTimer.EndTime.Value - activeTimer.StartTime.Value).TotalSeconds;
            }

            await _context.SaveChangesAsync(default);

            return MapToDto(activeTimer);
        }

        public async Task<TimeEntryDto> LogManualTimeAsync(Guid workspaceId, Guid taskId, Guid userId, ManualTimeRequest request)
        {
            var entry = new TaskTimeEntry
            {
                WorkspaceId = workspaceId,
                TaskId = taskId,
                UserId = userId,
                StartTime = request.Date ?? DateTime.UtcNow, // Use provided date or now as reference
                EndTime = (request.Date ?? DateTime.UtcNow).AddSeconds(request.DurationSeconds), // Set EndTime to match duration for consistency
                DurationSeconds = request.DurationSeconds,
                Description = request.Description,
                IsManual = true
            };

            _context.TaskTimeEntries.Add(entry);
            await _context.SaveChangesAsync(default);
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            entry.User = user!;

            return MapToDto(entry);
        }

        public async Task<List<TimeEntryDto>> GetTaskTimeEntriesAsync(Guid workspaceId, Guid taskId)
        {
            var entries = await _context.TaskTimeEntries
                .Include(t => t.User)
                .Where(t => t.WorkspaceId == workspaceId && t.TaskId == taskId)
                .OrderByDescending(t => t.StartTime ?? t.CreatedAt)
                .ToListAsync();

            return entries.Select(MapToDto).ToList();
        }

        public async Task<TimeEntryDto> UpdateEntryAsync(Guid workspaceId, Guid entryId, Guid userId, UpdateTimeEntryRequest request)
        {
            var entry = await _context.TaskTimeEntries
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == entryId && t.WorkspaceId == workspaceId);

            if (entry == null) throw new Exception("Entry not found");
            
            // Permission check: User can edit own, maybe admins can edit all?
            // User requirement: "Edit/delete ONLY their own time entries"
            if (entry.UserId != userId)
            {
                // Check if user is task creator? "Task creator can view all entries". Edit? Implies maybe no.
                // Strict rule: Only own.
                throw new UnauthorizedAccessException("Cannot edit other user's time entry");
            }

            if (request.DurationSeconds.HasValue) entry.DurationSeconds = request.DurationSeconds.Value;
            if (request.Description != null) entry.Description = request.Description;
            if (request.StartTime.HasValue) entry.StartTime = request.StartTime;
            if (request.EndTime.HasValue) entry.EndTime = request.EndTime;

            // Recalculate duration if start/end changed and it's not manual?
            if (!entry.IsManual && entry.StartTime.HasValue && entry.EndTime.HasValue)
            {
                entry.DurationSeconds = (int)(entry.EndTime.Value - entry.StartTime.Value).TotalSeconds;
            }

            await _context.SaveChangesAsync(default);

            return MapToDto(entry);
        }

        public async Task DeleteEntryAsync(Guid workspaceId, Guid entryId, Guid userId)
        {
            var entry = await _context.TaskTimeEntries
                .FirstOrDefaultAsync(t => t.Id == entryId && t.WorkspaceId == workspaceId);

            if (entry == null) return;

            if (entry.UserId != userId)
            {
                throw new UnauthorizedAccessException("Cannot delete other user's time entry");
            }

            _context.TaskTimeEntries.Remove(entry);
            await _context.SaveChangesAsync(default);
        }
        
        public async Task<TimeEntryDto?> GetActiveTimerAsync(Guid workspaceId, Guid userId)
        {
             var activeTimer = await _context.TaskTimeEntries
                .Include(t => t.User)
                .Where(t => t.UserId == userId && t.EndTime == null)
                .FirstOrDefaultAsync();
                
             return activeTimer == null ? null : MapToDto(activeTimer);
        }

        private static TimeEntryDto MapToDto(TaskTimeEntry entry)
        {
            return new TimeEntryDto
            {
                Id = entry.Id,
                TaskId = entry.TaskId,
                UserId = entry.UserId,
                UserName = entry.User?.FullName ?? "Unknown",
                UserAvatarUrl = entry.User?.AvatarUrl,
                StartTime = entry.StartTime,
                EndTime = entry.EndTime,
                DurationSeconds = entry.DurationSeconds,
                Description = entry.Description,
                IsManual = entry.IsManual,
                CreatedAt = entry.CreatedAt
            };
        }
    }
}
