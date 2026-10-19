using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Options;
using Circa.Auth.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;

namespace Circa.Auth.Infrastructure.Endpoints;

public static class AuthEndpoints
{
    public const string RefreshTokenCookieName = "circa_rt";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").AllowAnonymous();

        group.MapPost("/register", async (
            RegisterRequest request,
            RegisterHandler handler,
            ISessionService sessionService,
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

            var (_, rawRefreshToken) = await sessionService.CreateSessionAsync(
                result.Value!.Id,
                now,
                ip,
                userAgent,
                ct);

            SetRefreshTokenCookie(httpContext, rawRefreshToken, authOptions.Value);

            return Results.Created($"/api/auth/users/{result.Value.Id}", result.Value);
        });

        group.MapPost("/login", async (
            LoginRequest request,
            LoginHandler handler,
            ISessionService sessionService,
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

            var (_, rawRefreshToken) = await sessionService.CreateSessionAsync(
                result.Value!.Id,
                now,
                ip,
                userAgent,
                ct);

            SetRefreshTokenCookie(httpContext, rawRefreshToken, authOptions.Value);

            return Results.Ok(result.Value);
        });

        group.MapPost("/refresh", async (
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

            var now = DateTimeOffset.UtcNow;
            var refreshResult = await sessionService.RefreshAsync(rawRefreshToken, now, ct);

            if (!refreshResult.Succeeded)
            {
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
                return Results.Unauthorized();
            }

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

            DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            return Results.NoContent();
        });

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
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            }

            return Results.NoContent();
        });

        return endpoints;
    }

    public static void SetRefreshTokenCookie(HttpContext context, string token, AuthOptions options)
    {
        var cookieOptions = new CookieOptions
        {
            Path = "/api/auth",
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
            Path = "/api/auth",
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
