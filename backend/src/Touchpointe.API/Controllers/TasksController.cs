using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/tasks")]
    [Authorize]
    public class TasksController : BaseController
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(Guid workspaceId, CreateTaskRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var task = await _taskService.CreateTaskAsync(workspaceId, userId, request, cancellationToken);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("list/{listId}")]
        public async Task<ActionResult<List<TaskDto>>> GetTasks(Guid workspaceId, Guid listId, CancellationToken cancellationToken)
        {
            try
            {
                var tasks = await _taskService.GetTasksByListAsync(workspaceId, listId, cancellationToken);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{taskId}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(Guid workspaceId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var task = await _taskService.UpdateTaskAsync(workspaceId, userId, taskId, request, cancellationToken);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{taskId}/activities")]
        public async Task<ActionResult<List<TaskActivityDto>>> GetActivities(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            try
            {
                var activities = await _taskService.GetTaskActivitiesAsync(workspaceId, taskId, cancellationToken);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("{taskId}")]
        public async Task<ActionResult<TaskDetailDto>> GetTaskDetails(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            try
            {
                var details = await _taskService.GetTaskDetailsAsync(workspaceId, taskId, cancellationToken);
                return Ok(details);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{taskId}/subtasks")]
        public async Task<ActionResult<SubtaskDto>> AddSubtask(Guid workspaceId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var subtask = await _taskService.AddSubtaskAsync(workspaceId, userId, taskId, request, cancellationToken);
                return Ok(subtask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("subtasks/{subtaskId}/toggle")]
        public async Task<ActionResult<SubtaskDto>> ToggleSubtask(Guid workspaceId, Guid subtaskId, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var subtask = await _taskService.ToggleSubtaskAsync(workspaceId, userId, subtaskId, cancellationToken);
                return Ok(subtask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{taskId}/comments")]
        public async Task<ActionResult<TaskCommentDto>> AddComment(Guid workspaceId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var comment = await _taskService.AddCommentAsync(workspaceId, userId, taskId, request, cancellationToken);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<List<MyTaskDto>>> GetMyTasks(Guid workspaceId, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                var tasks = await _taskService.GetMyTasksAsync(userId, workspaceId, cancellationToken);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{taskId}")]
        public async Task<ActionResult> DeleteTask(Guid workspaceId, Guid taskId, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserId();
                await _taskService.DeleteTaskAsync(workspaceId, userId, taskId, cancellationToken);
                return Ok(new { message = "Task deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
