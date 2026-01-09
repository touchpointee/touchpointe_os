using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.Infrastructure.Middleware
{
    public class WorkspaceAuthorizationMiddleware
    {
        private readonly RequestDelegate _next;

        public WorkspaceAuthorizationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext, IWorkspaceContext workspaceContext)
        {
            // Skip for non-workspace routes (auth, health, etc.)
            var path = context.Request.Path.Value?.ToLower() ?? "";
            if (path.StartsWith("/auth") || path.StartsWith("/swagger") || path.StartsWith("/health"))
            {
                await _next(context);
                return;
            }

            // Extract workspace_id from route parameter or header
            string? workspaceIdString = null;
            
            // Try route value first
            if (context.Request.RouteValues.TryGetValue("workspaceId", out var routeValue))
            {
                workspaceIdString = routeValue?.ToString();
            }
            // Fallback to header (for API consistency)
            else if (context.Request.Headers.TryGetValue("X-Workspace-Id", out var headerValue))
            {
                workspaceIdString = headerValue.FirstOrDefault();
            }

            // If no workspace context needed for this route, continue
            if (string.IsNullOrEmpty(workspaceIdString))
            {
                await _next(context);
                return;
            }

            // Validate workspace_id format
            if (!Guid.TryParse(workspaceIdString, out var workspaceId))
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid workspace_id format" });
                return;
            }

            // Get authenticated user
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { error = "Authentication required" });
                return;
            }

            // Verify user is a member of the workspace
            var isMember = await dbContext.WorkspaceMembers
                .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId);

            if (!isMember)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { error = "Access denied to this workspace" });
                return;
            }

            // Inject workspace_id into context
            workspaceContext.SetWorkspaceId(workspaceId);

            await _next(context);
        }
    }
}
