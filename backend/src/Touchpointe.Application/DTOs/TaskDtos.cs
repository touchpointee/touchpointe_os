using Touchpointe.Domain.Entities;
using Touchpointe.Application.DTOs.Tasks;

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
        string? Description = null,
        TaskPriorityDto? Priority = null,
        Guid? AssigneeId = null,
        DateTime? DueDate = null,
        string? SubDescription = null,
        string? CustomStatus = null,
        List<Guid>? TagIds = null
    );

    public record UpdateTaskRequest(
        string? Title = null,
        string? Description = null,
        TaskStatusDto? Status = null,
        TaskPriorityDto? Priority = null,
        Guid? AssigneeId = null,
        DateTime? DueDate = null,
        int? OrderIndex = null,
        string? SubDescription = null,
        string? CustomStatus = null,
        List<Guid>? TagIds = null
    );

    public record TaskDto(
        Guid Id,
        Guid WorkspaceId,
        Guid ListId,
        string Title,
        string? Description,
        string Status, 
        string Priority, 
        Guid? AssigneeId,
        string? AssigneeName,
        string? AssigneeAvatarUrl,
        Guid CreatedById,
        string CreatedByName,
        DateTime? DueDate,
        int OrderIndex,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string? SubDescription,
        string? CustomStatus,
        List<TagDto> Tags
    )
    {
        public string Status { get; set; } = Status;
    }

    public record TagDto(
        Guid Id,
        string Name,
        string Color
    );

    public record SubtaskDto(
        Guid Id,
        string Title,
        bool IsCompleted,
        Guid? AssigneeId,
        string? AssigneeName,
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
        List<TaskActivityDto> Activities,
        List<TaskAttachmentDto> Attachments
    );

    public record CreateSubtaskRequest(string Title, Guid? AssigneeId = null);
    public record CreateCommentRequest(string Content);
    public record UpdateCommentRequest(string Content);
}
