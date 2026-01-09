using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    public enum TaskStatusDto
    {
        TODO,
        IN_PROGRESS,
        IN_REVIEW,
        DONE
    }

    public enum TaskPriorityDto
    {
        NONE,
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }

    public record CreateTaskRequest(
        Guid ListId,
        string Title,
        string? Description,
        TaskPriorityDto Priority = TaskPriorityDto.MEDIUM,
        Guid AssigneeId = default,
        DateTime? DueDate = null,
        string? SubDescription = null
    );

    public record UpdateTaskRequest(
        string? Title,
        string? Description,
        TaskStatusDto? Status,
        TaskPriorityDto? Priority,
        Guid? AssigneeId,
        DateTime? DueDate,
        int? OrderIndex,
        string? SubDescription = null
    );

    public record TaskDto(
        Guid Id,
        Guid WorkspaceId,
        Guid ListId,
        string Title,
        string? Description,
        string Status, 
        string Priority, 
        Guid AssigneeId,
        string AssigneeName,
        string? AssigneeAvatarUrl,
        Guid CreatedById,
        string CreatedByName,
        DateTime? DueDate,
        int OrderIndex,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string? SubDescription
    );

    public record SubtaskDto(
        Guid Id,
        string Title,
        bool IsCompleted,
        Guid AssigneeId,
        string AssigneeName,
        int OrderIndex
    );

    public record TaskActivityDto(
        Guid Id,
        string ActivityType,
        string? OldValue,
        string? NewValue,
        Guid ChangedById,
        string ChangedByName,
        DateTime Timestamp
    );

    public record TaskCommentDto(
        Guid Id,
        Guid UserId,
        string UserName,
        string UserAvatar, // For future use
        string Content,
        DateTime CreatedAt
    );

    public record TaskDetailDto(
        TaskDto Task,
        List<SubtaskDto> Subtasks,
        List<TaskCommentDto> Comments,
        List<TaskActivityDto> Activities
    );

    public record CreateSubtaskRequest(string Title, Guid AssigneeId = default);
    public record CreateCommentRequest(string Content);
}
