using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Touchpointe.Infrastructure.Middleware
{
    public class SlowRequestMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SlowRequestMiddleware> _logger;
        private const int ThresholdMilliseconds = 500;

        public SlowRequestMiddleware(RequestDelegate next, ILogger<SlowRequestMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();
                var elapsed = stopwatch.ElapsedMilliseconds;

                if (elapsed > ThresholdMilliseconds)
                {
                    var path = context.Request.Path;
                    var method = context.Request.Method;
                    var statusCode = context.Response.StatusCode;
                    var traceId = context.TraceIdentifier;

                    _logger.LogWarning("Slow Request Detected: {Method} {Path} took {Duration}ms [Status: {StatusCode}] [TraceId: {TraceId}]", 
                        method, path, elapsed, statusCode, traceId);
                }
            }
        }
    }
}
