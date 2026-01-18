using Touchpointe.Api.Hubs;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Touchpointe.Application;
using Touchpointe.Infrastructure;
using Touchpointe.Infrastructure.Middleware;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Infrastructure.Persistence;
using Touchpointe.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// 13. Add services to the container.
builder.Configuration.AddEnvironmentVariables(); // Ensure all env vars are loaded (e.g. FRONTEND_URL)

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
builder.Services.AddSignalR(); // Add SignalR Service
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

app.UseSwagger();
app.UseSwaggerUI();
app.MapOpenApi();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Workspace isolation
app.UseMiddleware<WorkspaceAuthorizationMiddleware>();

app.MapControllers();
app.MapHub<Touchpointe.Api.Hubs.ChatHub>("/api/hubs/chat");
app.MapHub<Touchpointe.API.Hubs.MeetHub>("/api/hubs/meet");

app.Run();
