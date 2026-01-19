using Touchpointe.Application.DTOs;
using Touchpointe.Application.Common.Models;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITaskService
    {
        Task<PaginatedList<TaskDto>> GetTasksByListAsync(Guid workspaceId, Guid listId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
        Task<PaginatedList<MyTaskDto>> GetMyTasksAsync(Guid userId, Guid workspaceId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);        Task<TaskDto> CreateTaskAsync(Guid workspaceId, Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default);
        Task<TaskDto> UpdateTaskAsync(Guid workspaceId, Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default);
        Task<List<TaskActivityDto>> GetTaskActivitiesAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default);
        
        Task<TaskDetailDto> GetTaskDetailsAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default);
        Task<SubtaskDto> AddSubtaskAsync(Guid workspaceId, Guid userId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken = default);
        Task<SubtaskDto> ToggleSubtaskAsync(Guid workspaceId, Guid userId, Guid subtaskId, CancellationToken cancellationToken = default);
        Task<TaskCommentDto> AddCommentAsync(Guid workspaceId, Guid userId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken = default);

        Task DeleteTaskAsync(Guid workspaceId, Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    }
}
