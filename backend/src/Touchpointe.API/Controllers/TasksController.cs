using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Application.Common.Models;

using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/tasks")]
    [Authorize]
    [EnableRateLimiting("ApiLimiter")]
    public class TasksController : BaseController
    {
        private readonly ITaskService _taskService;
        private readonly IAuditService _auditService;
        private readonly IApplicationDbContext _context;

        public TasksController(ITaskService taskService, IAuditService auditService, IApplicationDbContext context)
        {
            _taskService = taskService;
            _auditService = auditService;
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(Guid workspaceId, CreateTaskRequest request, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var task = await _taskService.CreateTaskAsync(workspaceId, userId, request, cancellationToken);
            return Ok(task);
        }

        [HttpGet("list/{listId}")]
        public async Task<ActionResult<PaginatedList<TaskDto>>> GetTasks(Guid workspaceId, Guid listId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default)
        {
            var tasks = await _taskService.GetTasksByListAsync(workspaceId, listId, page, pageSize, cancellationToken);
            return Ok(tasks);
        }

        [HttpPut("{taskId}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(Guid workspaceId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var task = await _taskService.UpdateTaskAsync(workspaceId, userId, taskId, request, cancellationToken);
            return Ok(task);
        }

        [HttpGet("{taskId}/activities")]
        public async Task<ActionResult<List<TaskActivityDto>>> GetActivities(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            var activities = await _taskService.GetTaskActivitiesAsync(workspaceId, taskId, cancellationToken);
            return Ok(activities);
        }
        [HttpGet("{taskId}")]
        public async Task<ActionResult<TaskDetailDto>> GetTaskDetails(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            var details = await _taskService.GetTaskDetailsAsync(workspaceId, taskId, cancellationToken);
            return Ok(details);
        }

        [HttpPost("{taskId}/subtasks")]
        public async Task<ActionResult<SubtaskDto>> AddSubtask(Guid workspaceId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var subtask = await _taskService.AddSubtaskAsync(workspaceId, userId, taskId, request, cancellationToken);
            return Ok(subtask);
        }

        [HttpPut("subtasks/{subtaskId}/toggle")]
        public async Task<ActionResult<SubtaskDto>> ToggleSubtask(Guid workspaceId, Guid subtaskId, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var subtask = await _taskService.ToggleSubtaskAsync(workspaceId, userId, subtaskId, cancellationToken);
            return Ok(subtask);
        }

        [HttpPost("{taskId}/comments")]
        public async Task<ActionResult<TaskCommentDto>> AddComment(Guid workspaceId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var comment = await _taskService.AddCommentAsync(workspaceId, userId, taskId, request, cancellationToken);
            return Ok(comment);
        }

        [HttpPut("comments/{commentId}")]
        public async Task<ActionResult<TaskCommentDto>> UpdateComment(Guid workspaceId, Guid commentId, [FromBody] UpdateCommentRequest request, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var comment = await _taskService.UpdateCommentAsync(workspaceId, userId, commentId, request.Content, cancellationToken);
            return Ok(comment);
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<ActionResult> DeleteComment(Guid workspaceId, Guid commentId, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            await _taskService.DeleteCommentAsync(workspaceId, userId, commentId, cancellationToken);
            return Ok(new { message = "Comment deleted" });
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<PaginatedList<MyTaskDto>>> GetMyTasks(Guid workspaceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var tasks = await _taskService.GetMyTasksAsync(userId, workspaceId, page, pageSize, cancellationToken);
            return Ok(tasks);
        }

        [HttpDelete("{taskId}")]
        public async Task<ActionResult> DeleteTask(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            await _taskService.DeleteTaskAsync(workspaceId, userId, taskId, cancellationToken);

            // Audit Log
            try 
            {
                var member = await _context.WorkspaceMembers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId, cancellationToken);
                
                var role = member != null ? member.Role.ToString() : "Unknown";

                await _auditService.LogAsync(userId, workspaceId, role, "Task.Delete", taskId.ToString(), HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            }
            catch 
            {
                // Audit failure should not crash the request
            }

            return Ok(new { message = "Task deleted successfully" });
        }
    }
}
