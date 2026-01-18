using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITaskService
    {
        Task<List<TaskDto>> GetTasksByListAsync(Guid workspaceId, Guid listId, CancellationToken cancellationToken = default);
        Task<TaskDto> CreateTaskAsync(Guid workspaceId, Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default);
        Task<TaskDto> UpdateTaskAsync(Guid workspaceId, Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default);
        Task<List<TaskActivityDto>> GetTaskActivitiesAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default);
        
        Task<TaskDetailDto> GetTaskDetailsAsync(Guid workspaceId, Guid taskId, CancellationToken cancellationToken = default);
        Task<SubtaskDto> AddSubtaskAsync(Guid workspaceId, Guid userId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken = default);
        Task<SubtaskDto> ToggleSubtaskAsync(Guid workspaceId, Guid userId, Guid subtaskId, CancellationToken cancellationToken = default);
        Task<TaskCommentDto> AddCommentAsync(Guid workspaceId, Guid userId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken = default);
        Task<List<MyTaskDto>> GetMyTasksAsync(Guid userId, Guid workspaceId, CancellationToken cancellationToken = default);
        Task DeleteTaskAsync(Guid workspaceId, Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    }
}
