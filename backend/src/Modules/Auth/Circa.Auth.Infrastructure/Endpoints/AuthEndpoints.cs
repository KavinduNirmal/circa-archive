using System.Security.Claims;
using Asp.Versioning;
using Circa.Auth.Application;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Options;
using Circa.Auth.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;

namespace Circa.Auth.Infrastructure.Endpoints;

public static class AuthEndpoints
{
    public const string AccessTokenCookieName = "circa_at";
    public const string RefreshTokenCookieName = "circa_rt";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/auth")
            .AllowAnonymous()
            .HasApiVersion(new ApiVersion(1, 0));

        group.MapPost("/register", async (
            RegisterRequest request,
            RegisterHandler handler,
            UserManager<AppUser> userManager,
            ISessionService sessionService,
            IAccessTokenService accessTokenService,
            IOptions<AuthOptions> authOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);

            if (!result.Succeeded)
            {
                return result.FailureReason switch
                {
                    AuthFailureReason.UsernameTaken => Results.Conflict(new { error = result.ErrorMessage, code = "username_taken" }),
                    AuthFailureReason.EmailTaken => Results.Conflict(new { error = result.ErrorMessage, code = "email_taken" }),
                    _ => Results.BadRequest(new { error = result.ErrorMessage, code = "validation_failed" })
                };
            }

            var now = DateTimeOffset.UtcNow;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            var (session, rawRefreshToken) = await sessionService.CreateSessionAsync(
                result.Value!.Id,
                now,
                ip,
                userAgent,
                ct);

            var user = await userManager.FindByIdAsync(result.Value.Id.ToString());
            if (user is not null)
            {
                var accessToken = accessTokenService.Issue(user, session, now);
                SetAccessTokenCookie(httpContext, accessToken, authOptions.Value);
            }

            SetRefreshTokenCookie(httpContext, rawRefreshToken, authOptions.Value);

            return Results.Created($"/api/v1/auth/users/{result.Value.Id}", result.Value);
        });

        group.MapPost("/login", async (
            LoginRequest request,
            LoginHandler handler,
            UserManager<AppUser> userManager,
            ISessionService sessionService,
            IAccessTokenService accessTokenService,
            IOptions<AuthOptions> authOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);

            if (!result.Succeeded)
            {
                return result.FailureReason switch
                {
                    AuthFailureReason.LockedOut => Results.Json(
                        new { error = result.ErrorMessage, code = "locked" },
                        statusCode: StatusCodes.Status423Locked),
                    _ => Results.Json(
                        new { error = "Invalid credentials.", code = "invalid_credentials" },
                        statusCode: StatusCodes.Status401Unauthorized)
                };
            }

            var now = DateTimeOffset.UtcNow;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            var (session, rawRefreshToken) = await sessionService.CreateSessionAsync(
                result.Value!.Id,
                now,
                ip,
                userAgent,
                ct);

            var user = await userManager.FindByIdAsync(result.Value.Id.ToString());
            if (user is not null)
            {
                var accessToken = accessTokenService.Issue(user, session, now);
                SetAccessTokenCookie(httpContext, accessToken, authOptions.Value);
            }

            SetRefreshTokenCookie(httpContext, rawRefreshToken, authOptions.Value);

            return Results.Ok(result.Value);
        });

        group.MapPost("/refresh", async (
            ISessionService sessionService,
            IAccessTokenService accessTokenService,
            UserManager<AppUser> userManager,
            IOptions<AuthOptions> authOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) ||
                string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                return Results.Unauthorized();
            }

            var now = DateTimeOffset.UtcNow;
            var refreshResult = await sessionService.RefreshAsync(rawRefreshToken, now, ct);

            if (!refreshResult.Succeeded || refreshResult.Session is null)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
                return Results.Unauthorized();
            }

            var user = await userManager.FindByIdAsync(refreshResult.Session.UserId.ToString());
            if (user is null)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
                return Results.Unauthorized();
            }

            var accessToken = accessTokenService.Issue(user, refreshResult.Session, now);
            SetAccessTokenCookie(httpContext, accessToken, authOptions.Value);
            SetRefreshTokenCookie(httpContext, refreshResult.ReplacementToken!, authOptions.Value);

            return Results.NoContent();
        });

        group.MapPost("/logout", async (
            ISessionService sessionService,
            IOptions<AuthOptions> authOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) &&
                !string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                var session = await sessionService.FindSessionByRawTokenAsync(rawRefreshToken, ct);
                if (session is not null)
                {
                    await sessionService.RevokeSessionAsync(session.Id, DateTimeOffset.UtcNow, "manual_logout", ct);
                }
            }
            else if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                var sidStr = httpContext.User.FindFirst("sid")?.Value;
                if (Guid.TryParse(sidStr, out var sid))
                {
                    await sessionService.RevokeSessionAsync(sid, DateTimeOffset.UtcNow, "manual_logout", ct);
                }
            }

            DeleteAccessTokenCookie(httpContext, authOptions.Value);
            DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            return Results.NoContent();
        });

        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            UserManager<AppUser> userManager,
            CancellationToken ct) =>
        {
            var userIdStr = principal.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var user = await userManager.FindByIdAsync(userIdStr);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(new
            {
                id = user.Id,
                username = user.UserName,
                role = user.Role,
                createdAt = user.CreatedAt
            });
        }).RequireAuthorization();

        group.MapGet("/sessions", async (
            ISessionService sessionService,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) ||
                string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                return Results.Unauthorized();
            }

            var session = await sessionService.FindSessionByRawTokenAsync(rawRefreshToken, ct);
            if (session is null || !session.IsLive(DateTimeOffset.UtcNow))
            {
                return Results.Unauthorized();
            }

            var sessions = await sessionService.GetUserSessionsAsync(session.UserId, session.Id, ct);
            return Results.Ok(sessions);
        });

        group.MapDelete("/sessions/{id:guid}", async (
            Guid id,
            ISessionService sessionService,
            IOptions<AuthOptions> authOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) ||
                string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                return Results.Unauthorized();
            }

            var currentSession = await sessionService.FindSessionByRawTokenAsync(rawRefreshToken, ct);
            if (currentSession is null || !currentSession.IsLive(DateTimeOffset.UtcNow))
            {
                return Results.Unauthorized();
            }

            await sessionService.RevokeSessionAsync(id, DateTimeOffset.UtcNow, "user_revoked", ct);

            if (currentSession.Id == id)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            }

            return Results.NoContent();
        });

        return endpoints;
    }

    public static void SetAccessTokenCookie(HttpContext context, string token, AuthOptions options)
    {
        var cookieOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = options.AccessTokenLifetime,
            Secure = options.RequireSecureCookies
        };

        if (!string.IsNullOrEmpty(options.CookieDomain))
        {
            cookieOptions.Domain = options.CookieDomain;
        }

        context.Response.Cookies.Append(AccessTokenCookieName, token, cookieOptions);
    }

    public static void DeleteAccessTokenCookie(HttpContext context, AuthOptions options)
    {
        var cookieOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = options.RequireSecureCookies
        };

        if (!string.IsNullOrEmpty(options.CookieDomain))
        {
            cookieOptions.Domain = options.CookieDomain;
        }

        context.Response.Cookies.Delete(AccessTokenCookieName, cookieOptions);
    }

    public static void SetRefreshTokenCookie(HttpContext context, string token, AuthOptions options)
    {
        var cookieOptions = new CookieOptions
        {
            Path = "/api/v1/auth",
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            MaxAge = options.SessionLifetime,
            Secure = options.RequireSecureCookies
        };

        if (!string.IsNullOrEmpty(options.CookieDomain))
        {
            cookieOptions.Domain = options.CookieDomain;
        }

        context.Response.Cookies.Append(RefreshTokenCookieName, token, cookieOptions);
    }

    public static void DeleteRefreshTokenCookie(HttpContext context, AuthOptions options)
    {
        var cookieOptions = new CookieOptions
        {
            Path = "/api/v1/auth",
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Secure = options.RequireSecureCookies
        };

        if (!string.IsNullOrEmpty(options.CookieDomain))
        {
            cookieOptions.Domain = options.CookieDomain;
        }

        context.Response.Cookies.Delete(RefreshTokenCookieName, cookieOptions);
    }
}
