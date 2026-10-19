using Circa.Auth.Infrastructure.Logging;
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
                    AuthFailureReason.UsernameTaken => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        detail: result.ErrorMessage,
                        extensions: new Dictionary<string, object?> { ["code"] = "username_taken" }),
                    AuthFailureReason.EmailTaken => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        detail: result.ErrorMessage,
                        extensions: new Dictionary<string, object?> { ["code"] = "email_taken" }),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Bad Request",
                        detail: result.ErrorMessage,
                        extensions: new Dictionary<string, object?> { ["code"] = "validation_failed" })
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
        }).AllowAnonymous().RequireRateLimiting("register_limit");

        group.MapPost("/login", async (
            LoginRequest request,
            LoginHandler handler,
            UserManager<AppUser> userManager,
            ISessionService sessionService,
            IAccessTokenService accessTokenService,
            IOptions<AuthOptions> authOptions,
            IAuthEventLogger authEventLogger,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();

            if (!result.Succeeded)
            {
                if (result.FailureReason == AuthFailureReason.LockedOut)
                {
                    authEventLogger.LogLoginFailure(request.Identifier, "locked", ip);
                    return Results.Problem(
                        statusCode: StatusCodes.Status423Locked,
                        title: "Locked",
                        detail: result.ErrorMessage,
                        extensions: new Dictionary<string, object?> { ["code"] = "locked" });
                }

                authEventLogger.LogLoginFailure(request.Identifier, "invalid_credentials", ip);
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Invalid credentials.",
                    extensions: new Dictionary<string, object?> { ["code"] = "invalid_credentials" });
            }

            var now = DateTimeOffset.UtcNow;
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
            authEventLogger.LogLoginSuccess(result.Value.Id, result.Value.Username, ip);

            return Results.Ok(result.Value);
        }).AllowAnonymous().RequireRateLimiting("login_limit");

        group.MapPost("/refresh", async (
            ISessionService sessionService,
            IAccessTokenService accessTokenService,
            UserManager<AppUser> userManager,
            IOptions<AuthOptions> authOptions,
            IAuthEventLogger authEventLogger,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) ||
                string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or missing.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var now = DateTimeOffset.UtcNow;
            var refreshResult = await sessionService.RefreshAsync(rawRefreshToken, now, ct);

            if (!refreshResult.Succeeded || refreshResult.Session is null)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);

                var code = refreshResult.Status == SessionRefreshStatus.ReuseDetected
                    ? "refresh_reuse"
                    : "session_expired";

                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or revoked.",
                    extensions: new Dictionary<string, object?> { ["code"] = code });
            }

            var user = await userManager.FindByIdAsync(refreshResult.Session.UserId.ToString());
            if (user is null)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "User not found.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var accessToken = accessTokenService.Issue(user, refreshResult.Session, now);
            SetAccessTokenCookie(httpContext, accessToken, authOptions.Value);
            SetRefreshTokenCookie(httpContext, refreshResult.ReplacementToken!, authOptions.Value);

            authEventLogger.LogRefreshSuccess(refreshResult.Session.Id, refreshResult.Session.UserId);

            return Results.NoContent();
        }).AllowAnonymous().RequireRateLimiting("refresh_limit");

        group.MapPost("/logout", async (
            ISessionService sessionService,
            IOptions<AuthOptions> authOptions,
            IAuthEventLogger authEventLogger,
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
                    authEventLogger.LogLogout(session.Id, session.UserId);
                }
            }
            else if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                var sidStr = httpContext.User.FindFirst("sid")?.Value;
                var subStr = httpContext.User.FindFirst("sub")?.Value;
                if (Guid.TryParse(sidStr, out var sid) && Guid.TryParse(subStr, out var sub))
                {
                    await sessionService.RevokeSessionAsync(sid, DateTimeOffset.UtcNow, "manual_logout", ct);
                    authEventLogger.LogLogout(sid, sub);
                }
            }

            DeleteAccessTokenCookie(httpContext, authOptions.Value);
            DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            return Results.NoContent();
        }).AllowAnonymous();

        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            UserManager<AppUser> userManager,
            CancellationToken ct) =>
        {
            var userIdStr = principal.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Invalid user token.",
                    extensions: new Dictionary<string, object?> { ["code"] = "unauthorized" });
            }

            var user = await userManager.FindByIdAsync(userIdStr);
            if (user is null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "User not found.",
                    extensions: new Dictionary<string, object?> { ["code"] = "unauthorized" });
            }

            return Results.Ok(new
            {
                id = user.Id,
                username = user.UserName,
                role = user.Role,
                createdAt = user.CreatedAt
            });
        }).RequireAuthorization(policy => policy.RequireAuthenticatedUser().AddRequirements(new Circa.Auth.Contracts.LiveSessionRequirement()));

        group.MapGet("/sessions", async (
            ISessionService sessionService,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var rawRefreshToken) ||
                string.IsNullOrWhiteSpace(rawRefreshToken))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or missing.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var session = await sessionService.FindSessionByRawTokenAsync(rawRefreshToken, ct);
            if (session is null || !session.IsLive(DateTimeOffset.UtcNow))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or revoked.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var sessions = await sessionService.GetUserSessionsAsync(session.UserId, session.Id, ct);
            return Results.Ok(sessions);
        }).AllowAnonymous();

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
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or missing.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var currentSession = await sessionService.FindSessionByRawTokenAsync(rawRefreshToken, ct);
            if (currentSession is null || !currentSession.IsLive(DateTimeOffset.UtcNow))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Session expired or revoked.",
                    extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
            }

            var ownSessions = await sessionService.GetUserSessionsAsync(currentSession.UserId, currentSession.Id, ct);
            if (!ownSessions.Any(session => session.Id == id))
                return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden",
                    extensions: new Dictionary<string, object?> { ["code"] = "forbidden" });

            await sessionService.RevokeSessionAsync(id, DateTimeOffset.UtcNow, "user_revoked", ct);

            if (currentSession.Id == id)
            {
                DeleteAccessTokenCookie(httpContext, authOptions.Value);
                DeleteRefreshTokenCookie(httpContext, authOptions.Value);
            }

            return Results.NoContent();
        }).AllowAnonymous();

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
            Path = "/",
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
            Path = "/",
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
