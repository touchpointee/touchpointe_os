using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace Touchpointe.Infrastructure.Persistence
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            // Try to find connection string from various sources
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            
            // Fallback for when running from Infrastructure folder where appsettings might not be found relative to it
            // if executed from root, it might work, but let's be safe.
            // Actually, usually dotnet ef is run from the project dir or solution dir.
            // I'll hardcode the known dev connection string as a last resort fallback for design-time only if config fails
            if (string.IsNullOrEmpty(connectionString))
            {
                 connectionString = "Host=localhost;Database=touchpointe_ms;Username=postgres;Password=123456qw";
            }

            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
            builder.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));

            return new ApplicationDbContext(builder.Options);
        }
    }
}
