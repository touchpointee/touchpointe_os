using Touchpointe.Api.Hubs;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Touchpointe.Application;
using Touchpointe.Infrastructure;
using Touchpointe.Infrastructure.Middleware;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Infrastructure.Persistence;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 13. Add services to the container.
builder.Configuration.AddEnvironmentVariables(); // Ensure all env vars are loaded (e.g. FRONTEND_URL)

builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Direct Environment Variable Read (Bypassing Configuration Providers for reliability)
        var frontendUrls = Environment.GetEnvironmentVariable("FRONTEND_URL") 
                        ?? Environment.GetEnvironmentVariable("APP_FRONTEND_URL");
        var origins = !string.IsNullOrEmpty(frontendUrls)
            ? frontendUrls.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(o => o.Trim().TrimEnd('/'))
                          .ToArray()
            : Array.Empty<string>();

        Console.WriteLine($"[CORS CONFIG] Loaded FRONTEND_URL: '{frontendUrls}'");
        Console.WriteLine($"[CORS CONFIG] Parsed Origins: {string.Join(", ", origins)}");

        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else 
        {
             Console.WriteLine("[CORS CONFIG] WARNING: No origins configured! CORS requests will likely fail.");
        }
    });
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    
    // Global Limit: 300 requests per minute per authenticated user (or IP)
    options.AddPolicy("GlobalLimiter", context =>
    {
        // Use User Identity if available, otherwise IP
        var username = context.User.Identity?.IsAuthenticated == true
            ? context.User.Identity.Name
            : context.Connection.RemoteIpAddress?.ToString();

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(username ?? "anonymous",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            });
    });



    // Auth Limit: 10 attempts per minute (Login/Register protection)
    options.AddFixedWindowLimiter("AuthLimiter", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    // Standard API Limit: 60 requests per minute per user (Abuse prevention)
    options.AddPolicy("ApiLimiter", context =>
    {
        var username = context.User.Identity?.IsAuthenticated == true
            ? context.User.Identity.Name
            : context.Connection.RemoteIpAddress?.ToString();

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(username ?? "anonymous",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            });
    });

    // AI Endpoint Limit: 10 requests per minute per user (Cost control)
    options.AddPolicy("AiLimiter", context =>
    {
        var username = context.User.Identity?.IsAuthenticated == true
            ? context.User.Identity.Name
            : context.Connection.RemoteIpAddress?.ToString();

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(username ?? "anonymous",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            });
    });

    // Search Limit: 30 requests per minute per user (DB load protection)
    options.AddPolicy("SearchLimiter", context =>
    {
        var username = context.User.Identity?.IsAuthenticated == true
            ? context.User.Identity.Name
            : context.Connection.RemoteIpAddress?.ToString();

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(username ?? "anonymous",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            });
    });
});

var redisConnection = Environment.GetEnvironmentVariable("REDIS_CONNECTION");
var signalRBuilder = builder.Services.AddSignalR();
var isProduction = builder.Environment.IsProduction();

if (isProduction && string.IsNullOrEmpty(redisConnection))
{
    // WARNING: Single-instance mode - no Redis backplane configured
    // This works for single-server deployments but won't scale horizontally
    Console.WriteLine("[WARNING] Redis Connection not configured. Running in SINGLE-INSTANCE mode.");
    Console.WriteLine("[WARNING] SignalR will work but horizontal scaling is NOT supported.");
}

if (!string.IsNullOrEmpty(redisConnection))
{
    Console.WriteLine($"[REDIS] Configuring SignalR Backplane with connection: {redisConnection}");
    try 
    {
        signalRBuilder.AddStackExchangeRedis(redisConnection, options => {
            options.Configuration.ChannelPrefix = "Touchpointe";
        });
    }
    catch (Exception ex)
    {
        if (isProduction)
        {
             throw new InvalidOperationException($"[REDIS] Failed to configure Redis in Production: {ex.Message}", ex);
        }
        Console.WriteLine($"[REDIS] Failed to configure Redis: {ex.Message}. Falling back to in-memory.");
    }
}
else
{
    // No Redis connection string provided - single instance mode
    Console.WriteLine("[REDIS] Start without Redis Backplane (Single Instance Mode)");
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Register Swagger services
builder.Services.AddOpenApi();

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

// Register SignalR Notification Service
builder.Services.AddScoped<Touchpointe.Application.Common.Interfaces.IChatNotificationService, Touchpointe.Api.Services.ChatNotificationService>();

// Update Auth to support SignalR Query String
builder.Services.AddAuthentication(); // Ensure Auth is configured



builder.Services.AddAuthorization();


// Configure Forwarded Headers for Coolify/Nginx/Docker
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                               Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    // Trust all networks and proxies since we are behind a reverse proxy in Docker
    options.KnownNetworks.Clear(); 
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Apply any pending migrations on startup
// PHASE 3 HARDENING: Disabled auto-migrations for safety in multi-replica envs.
// Run migrations manually via CI/CD pipeine.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        if (context.Database.GetPendingMigrations().Any())
        {
            Console.WriteLine("[DB MIGRATION] Applying pending migrations...");
            context.Database.Migrate();
            Console.WriteLine("[DB MIGRATION] Migrations applied successfully.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB MIGRATION] ERROR: Could not apply migrations. {ex.Message}");
    }
}

app.UseForwardedHeaders(); // Must be first!

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<SlowRequestMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();
app.MapOpenApi();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Workspace isolation
app.UseMiddleware<WorkspaceAuthorizationMiddleware>();

app.MapControllers()
   .RequireRateLimiting("GlobalLimiter");
app.MapHub<Touchpointe.Api.Hubs.ChatHub>("/api/hubs/chat");
app.MapHub<Touchpointe.API.Hubs.MeetHub>("/api/hubs/meet");

app.Run();
