using Touchpointe.Api.Hubs;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Touchpointe.Application;
using Touchpointe.Infrastructure;
using Touchpointe.Infrastructure.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 13. Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrls = builder.Configuration["FRONTEND_URL"];
        var origins = !string.IsNullOrEmpty(frontendUrls)
            ? frontendUrls.Split(',', StringSplitOptions.RemoveEmptyEntries)
            : new[] { "http://localhost:5173", "http://localhost:3000" };

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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

var app = builder.Build();

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
app.MapHub<ChatHub>("/hubs/chat"); // Map the Hub

app.Run();
