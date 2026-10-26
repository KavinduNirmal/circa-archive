using Circa.Archive.Infrastructure.Persistence;
using Circa.Archive.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Archive.Infrastructure;

public static class ArchiveModuleExtensions
{
    public static IServiceCollection AddArchiveModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ArchiveDbContext>((sp, options) =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var connectionString = config.GetConnectionString("Archive")
                ?? config.GetConnectionString("Auth")
                ?? "Host=localhost;Database=circa;Username=circa;Password=circa_password";
            options.UseNpgsql(connectionString);
        });

        services.AddScoped<SearchReader>();
        services.AddScoped<ArchiveDestinationReader>();
        services.AddRateLimiter(options => options.AddPolicy<string, SearchRateLimiting>("archive_search"));

        return services;
    }
}
