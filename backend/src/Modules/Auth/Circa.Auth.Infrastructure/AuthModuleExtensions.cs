using Circa.Auth.Application;
using Circa.Auth.Contracts;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Options;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Auth.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Auth.Infrastructure;

public static class AuthModuleExtensions
{
    public static IServiceCollection AddAuthModule(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddDbContext<AuthDbContext>((sp, options) =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var connectionString = config.GetConnectionString("Auth")
                ?? "Host=localhost;Database=circa;Username=circa;Password=circa_password";
            options.UseNpgsql(connectionString);
        });

        services.AddDataProtection();

        services.AddIdentityCore<AppUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;

            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 10;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddEntityFrameworkStores<AuthDbContext>()
        .AddDefaultTokenProviders();

        services.Configure<PasswordHasherOptions>(options =>
        {
            options.IterationCount = 600_000;
        });

        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));

        services.AddScoped<RegisterHandler>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<IUserDirectory, UserDirectory>();
        services.AddScoped<ISessionService, SessionService>();

        return services;
    }
}
