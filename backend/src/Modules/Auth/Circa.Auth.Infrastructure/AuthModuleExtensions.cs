using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
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
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;

            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 10;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddEntityFrameworkStores<AuthDbContext>()
        .AddDefaultTokenProviders()
        .AddUserValidator<AccountValidator>();

        services.Configure<UsernamePolicyOptions>(configuration.GetSection("Auth:UsernamePolicy"));
        services.AddScoped<IUserStore<AppUser>, RegistrationUserStore>();

        services.Configure<PasswordHasherOptions>(options =>
        {
            options.IterationCount = 600_000;
        });

        services.AddOptions<AuthOptions>()
            .Bind(configuration.GetSection(AuthOptions.SectionName))
            .Validate(opts =>
            {
                if (string.IsNullOrWhiteSpace(opts.SigningKey) || System.Text.Encoding.UTF8.GetByteCount(opts.SigningKey) < 32)
                    return false;
                if (string.IsNullOrWhiteSpace(opts.Issuer)) return false;
                if (string.IsNullOrWhiteSpace(opts.Audience)) return false;
                if (opts.AccessTokenLifetimeSeconds != 600) return false;
                if (opts.LoginRateLimitPermitLimit <= 0 || opts.RegisterRateLimitPermitLimit <= 0 ||
                    opts.RefreshRateLimitPermitLimit <= 0) return false;
                return true;
            }, "AuthOptions validation failed: SigningKey >= 32 bytes, Issuer/Audience required, AccessTokenLifetimeSeconds must be 600.")
            .Validate(opts =>
            {
                if (!environment.IsDevelopment() && !opts.RequireSecureCookies)
                    return false;
                return true;
            }, "RequireSecureCookies must be true outside development.")
            .ValidateOnStart();

        services.AddSingleton<Logging.IAuthEventLogger, Logging.AuthEventLogger>();
        services.AddScoped<IAccessTokenService, AccessTokenService>();
        services.AddScoped<RegisterHandler>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<IUserDirectory, UserDirectory>();
        services.AddScoped<ISessionService, SessionService>();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/problem+json";
                var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too Many Requests",
                    Detail = "Rate limit exceeded. Please try again later."
                };
                problem.Extensions["code"] = "rate_limit_exceeded";
                await context.HttpContext.Response.WriteAsJsonAsync(problem, cancellationToken: token);
            };

            options.AddPolicy("display_name_limit", httpContext =>
                System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                    httpContext.Connection.RemoteIpAddress?.ToString() ?? "default_ip",
                    _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            options.AddPolicy("login_limit", httpContext =>
            {
                var authOpts = httpContext.RequestServices.GetRequiredService<IOptions<AuthOptions>>().Value;
                var ip = httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "default_ip";
                var identifier = httpContext.Items["Auth_RateLimit_Identifier"] as string ?? "";
                var key = $"{ip}:{identifier}";

                return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                    key,
                    _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authOpts.LoginRateLimitPermitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });

            options.AddPolicy("register_limit", httpContext =>
            {
                var authOpts = httpContext.RequestServices.GetRequiredService<IOptions<AuthOptions>>().Value;
                var ip = httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "default_ip";

                return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                    ip,
                    _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authOpts.RegisterRateLimitPermitLimit,
                        Window = TimeSpan.FromHours(1),
                        QueueLimit = 0
                    });
            });

            options.AddPolicy("refresh_limit", httpContext =>
            {
                var authOpts = httpContext.RequestServices.GetRequiredService<IOptions<AuthOptions>>().Value;
                var key = httpContext.Items["Auth_RateLimit_Session"] as string
                    ?? $"ip:{httpContext.Connection.RemoteIpAddress}";

                return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                    key,
                    _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authOpts.RefreshRateLimitPermitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });
        });

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
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.Headers.Append("WWW-Authenticate", "Bearer");
                        context.Response.ContentType = "application/problem+json";
                        var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
                        {
                            Status = StatusCodes.Status401Unauthorized,
                            Title = "Unauthorized",
                            Detail = "Authentication required."
                        };
                        problem.Extensions["code"] = "unauthorized";
                        await context.Response.WriteAsJsonAsync(problem);
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
