using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITaskService
    {
        Task<List<TaskDto>> GetTasksByListAsync(Guid workspaceId, Guid listId);
        Task<TaskDto> CreateTaskAsync(Guid workspaceId, Guid userId, CreateTaskRequest request);
        Task<TaskDto> UpdateTaskAsync(Guid workspaceId, Guid userId, Guid taskId, UpdateTaskRequest request);
        Task<List<TaskActivityDto>> GetTaskActivitiesAsync(Guid workspaceId, Guid taskId);
        
        Task<TaskDetailDto> GetTaskDetailsAsync(Guid workspaceId, Guid taskId);
        Task<SubtaskDto> AddSubtaskAsync(Guid workspaceId, Guid userId, Guid taskId, CreateSubtaskRequest request);
        Task<SubtaskDto> ToggleSubtaskAsync(Guid workspaceId, Guid userId, Guid subtaskId);
        Task<TaskCommentDto> AddCommentAsync(Guid workspaceId, Guid userId, Guid taskId, CreateCommentRequest request);
        Task<List<MyTaskDto>> GetMyTasksAsync(Guid userId, Guid workspaceId);
        Task DeleteTaskAsync(Guid workspaceId, Guid userId, Guid taskId);
    }
}
