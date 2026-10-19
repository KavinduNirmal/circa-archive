using Circa.Auth.Application;
using Circa.Auth.Contracts;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Options;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Auth.Infrastructure.Services;
using Circa.Auth.Infrastructure.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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

        services.AddScoped<IAccessTokenService, AccessTokenService>();
        services.AddScoped<RegisterHandler>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<IUserDirectory, UserDirectory>();
        services.AddScoped<ISessionService, SessionService>();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<AuthOptions>>((jwtOptions, authOptions) =>
            {
                var opts = authOptions.Value;
                jwtOptions.MapInboundClaims = false;
                var keyBytes = !string.IsNullOrEmpty(opts.SigningKey)
                    ? System.Text.Encoding.UTF8.GetBytes(opts.SigningKey)
                    : new byte[32];

                jwtOptions.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = opts.Issuer,
                    ValidateAudience = true,
                    ValidAudience = opts.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(keyBytes),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = "sub",
                    RoleClaimType = "role"
                };

                jwtOptions.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var authHeader = context.Request.Headers.Authorization.ToString();
                        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        {
                            return Task.CompletedTask;
                        }

                        if (context.Request.Cookies.TryGetValue(AuthEndpoints.AccessTokenCookieName, out var cookieToken) &&
                            !string.IsNullOrWhiteSpace(cookieToken))
                        {
                            context.Token = cookieToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddScoped<IAuthRequestContext, AuthRequestContext>();
        services.AddScoped<IAuthorizationHandler, LiveSessionHandler>();
        services.AddScoped<IAuthorizationHandler, CanPostHandler>();
        services.AddScoped<IAuthorizationHandler, StaffCannotRateHandler>();
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, CircaAuthorizationMiddlewareResultHandler>();

        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            options.AddPolicy(AuthPolicies.Writes, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.AddRequirements(new LiveSessionRequirement(), new CanPostRequirement());
            });

            options.AddPolicy(AuthPolicies.Moderator, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole("moderator");
                policy.AddRequirements(new LiveSessionRequirement());
            });

            options.AddPolicy(AuthPolicies.Votes, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.AddRequirements(
                    new LiveSessionRequirement(),
                    new CanPostRequirement(),
                    new StaffCannotRateRequirement());
            });
        });

        return services;
    }
}
