using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Touchpointe.Infrastructure.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var response = new ErrorResponse
            {
                TraceId = Activity.Current?.Id ?? context.TraceIdentifier
            };

            switch (exception)
            {
                case ValidationException validationException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Error = "Validation Error";
                    response.Details = validationException.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning(exception, "Validation failed");
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.Error = "Unauthorized Access";
                    _logger.LogWarning(exception, "Unauthorized access attempt");
                    break;

                case KeyNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Error = "Resource Not Found";
                    _logger.LogWarning(exception, "Resource not found");
                    break;

                case ArgumentException argumentException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Error = argumentException.Message;
                    _logger.LogWarning(exception, "Invalid argument");
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Error = "An internal error occurred.";
                    _logger.LogError(exception, "Unhandled exception occurred");
                    break;
            }

            var json = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
    }

    public class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
        public List<string>? Details { get; set; }
        public string TraceId { get; set; } = string.Empty;
    }
}
