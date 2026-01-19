using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Infrastructure.Authentication;
using Touchpointe.Infrastructure.Persistence;

namespace Touchpointe.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddMemoryCache();
            services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

            services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

            // Custom parsing for Coolify/Postgres URL format
            var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            string connectionString;

            if (!string.IsNullOrEmpty(dbUrl) && dbUrl.StartsWith("postgres://"))
            {
                try 
                {
                    var uri = new Uri(dbUrl);
                    var userInfo = uri.UserInfo.Split(new[] { ':' }, 2);
                    var builder = new Npgsql.NpgsqlConnectionStringBuilder
                    {
                        Host = uri.Host,
                        Port = uri.Port,
                        Database = uri.AbsolutePath.TrimStart('/'),
                        Username = userInfo[0],
                        Password = userInfo.Length > 1 ? userInfo[1] : null
                    };
                    connectionString = builder.ToString();
                }
                catch 
                {
                    connectionString = dbUrl; // Fallback to raw string if parsing fails
                }
            }
            else
            {
                connectionString = dbUrl ?? configuration.GetConnectionString("DefaultConnection");
            }

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Database connection string is missing. Please set 'DATABASE_URL' or 'ConnectionStrings:DefaultConnection'.");
            }

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString,
                    builder => builder.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName))
                    .ConfigureWarnings(warnings => warnings
                        .Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

            services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

            services.AddSingleton<IPasswordHasher, Touchpointe.Infrastructure.Security.PasswordHasher>();

            services.AddScoped<IWorkspaceContext, Touchpointe.Infrastructure.Services.WorkspaceContext>();
            services.AddScoped<IAuditService, Touchpointe.Infrastructure.Services.AuditService>();

            var jwtSettings = new JwtSettings();
            configuration.Bind(JwtSettings.SectionName, jwtSettings);

            // FALLBACK: Read from flat JWT_SECRET env var if not found in nested config
            if (string.IsNullOrEmpty(jwtSettings.Secret))
            {
                jwtSettings.Secret = configuration["JWT_SECRET"] ?? string.Empty;
            }

            if (string.IsNullOrEmpty(jwtSettings.Secret))
            {
                throw new InvalidOperationException("JWT Secret is missing. Please set 'JwtSettings:Secret' or 'JWT_SECRET' environment variable.");
            }

            services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtSettings));

            services.AddAuthentication(defaultScheme: Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSettings.Issuer,
                        ValidAudience = jwtSettings.Audience,
                        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                            System.Text.Encoding.UTF8.GetBytes(jwtSettings.Secret))
                    };

                    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            // 1. Try to get token from SignalR Query String
                            var accessToken = context.Request.Query["access_token"].ToString();

                            // 2. If not in query, try to get from HttpOnly Cookie
                            if (string.IsNullOrEmpty(accessToken))
                            {
                                if (context.Request.Cookies.TryGetValue("jwt", out var cookieToken))
                                {
                                    accessToken = cookieToken;
                                }
                            }

                            // 3. Set the token if found
                            if (!string.IsNullOrEmpty(accessToken))
                            {
                                context.Token = accessToken;
                            }
                            
                            return System.Threading.Tasks.Task.CompletedTask;
                        }
                    };
                });

            return services;
        }
    }
}
