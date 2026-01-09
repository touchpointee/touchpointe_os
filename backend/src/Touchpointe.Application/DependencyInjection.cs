using Microsoft.Extensions.DependencyInjection;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.Services.Authentication;
using Touchpointe.Application.Services.Crm;
using Touchpointe.Application.Services.Chat;

namespace Touchpointe.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IAuthenticationService, AuthenticationService>();
            services.AddScoped<IInvitationService, Services.Invitations.InvitationService>();
            services.AddScoped<IWorkspaceService, Services.Workspaces.WorkspaceService>();
            services.AddScoped<INotificationService, Services.Notifications.NotificationService>();
            services.AddScoped<ITaskHierarchyService, Services.Hierarchy.TaskHierarchyService>();
            services.AddScoped<ITaskService, Services.Tasks.TaskService>();
            services.AddScoped<ICrmService, CrmService>();
            services.AddScoped<IChatService, Services.Chat.ChatService>();
            services.AddScoped<ITeamService, Services.Team.TeamService>();
            services.AddScoped<IDashboardService, Services.Dashboard.DashboardService>();
            services.AddScoped<IAiService, Services.AI.AiService>();

            return services;
        }
    }
}
