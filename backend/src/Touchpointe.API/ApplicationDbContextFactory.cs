using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Touchpointe.Infrastructure.Persistence;

namespace Touchpointe.API
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            // Secure configuration builder
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                                ?? Environment.GetEnvironmentVariable("DATABASE_URL");

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Could not find connection string 'DefaultConnection' or 'DATABASE_URL'.");
            }

            // Parse postgres:// URL if present (Common in PaaS/Docker)
            if (connectionString.StartsWith("postgres://"))
            {
                try 
                {
                    var uri = new Uri(connectionString);
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
                    // Fallback to raw string if parsing fails
                }
            }

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseNpgsql(connectionString, b => b.MigrationsAssembly("Touchpointe.Infrastructure"));

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
