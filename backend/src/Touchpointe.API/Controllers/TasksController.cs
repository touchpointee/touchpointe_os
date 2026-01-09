using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("{workspaceId}/tasks")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(Guid workspaceId, CreateTaskRequest request)
        {
            try
            {
                var userId = GetUserId();
                var task = await _taskService.CreateTaskAsync(workspaceId, userId, request);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("list/{listId}")]
        public async Task<ActionResult<List<TaskDto>>> GetTasks(Guid workspaceId, Guid listId)
        {
            try
            {
                var tasks = await _taskService.GetTasksByListAsync(workspaceId, listId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{taskId}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(Guid workspaceId, Guid taskId, UpdateTaskRequest request)
        {
            try
            {
                var userId = GetUserId();
                var task = await _taskService.UpdateTaskAsync(workspaceId, userId, taskId, request);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{taskId}/activities")]
        public async Task<ActionResult<List<TaskActivityDto>>> GetActivities(Guid workspaceId, Guid taskId)
        {
            try
            {
                var activities = await _taskService.GetTaskActivitiesAsync(workspaceId, taskId);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("{taskId}")]
        public async Task<ActionResult<TaskDetailDto>> GetTaskDetails(Guid workspaceId, Guid taskId)
        {
            try
            {
                var details = await _taskService.GetTaskDetailsAsync(workspaceId, taskId);
                return Ok(details);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{taskId}/subtasks")]
        public async Task<ActionResult<SubtaskDto>> AddSubtask(Guid workspaceId, Guid taskId, CreateSubtaskRequest request)
        {
            try
            {
                var userId = GetUserId();
                var subtask = await _taskService.AddSubtaskAsync(workspaceId, userId, taskId, request);
                return Ok(subtask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("subtasks/{subtaskId}/toggle")]
        public async Task<ActionResult<SubtaskDto>> ToggleSubtask(Guid workspaceId, Guid subtaskId)
        {
            try
            {
                var userId = GetUserId();
                var subtask = await _taskService.ToggleSubtaskAsync(workspaceId, userId, subtaskId);
                return Ok(subtask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{taskId}/comments")]
        public async Task<ActionResult<TaskCommentDto>> AddComment(Guid workspaceId, Guid taskId, CreateCommentRequest request)
        {
            try
            {
                var userId = GetUserId();
                var comment = await _taskService.AddCommentAsync(workspaceId, userId, taskId, request);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
