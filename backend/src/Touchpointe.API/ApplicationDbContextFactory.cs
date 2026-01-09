using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Touchpointe.Infrastructure.Persistence;

namespace Touchpointe.API
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

            // Hardcoded connection string for design-time support
            var connectionString = "Host=localhost;Database=touchpointe_ms;Username=postgres;Password=123456qw";

            optionsBuilder.UseNpgsql(connectionString, b => b.MigrationsAssembly("Touchpointe.Infrastructure"));

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
