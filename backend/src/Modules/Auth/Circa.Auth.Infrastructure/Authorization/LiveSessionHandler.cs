using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace Circa.Auth.Infrastructure.Authorization;

public sealed class LiveSessionHandler : AuthorizationHandler<LiveSessionRequirement>
{
    public const string ArchiveRestrictedReason = "Account has a temporary archive restriction.";

    private readonly IAuthRequestContext _authContext;

    public LiveSessionHandler(IAuthRequestContext authContext)
    {
        _authContext = authContext;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        LiveSessionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var sidStr = context.User.FindFirst("sid")?.Value;
        if (!Guid.TryParse(sidStr, out var sessionId))
        {
            context.Fail(new AuthorizationFailureReason(this, "Session ID claim (sid) missing or invalid."));
            context.Fail();
            return;
        }

        var verStr = context.User.FindFirst("ver")?.Value;
        if (!int.TryParse(verStr, out var tokenVersion))
        {
            context.Fail(new AuthorizationFailureReason(this, "Token version claim (ver) missing or invalid."));
            context.Fail();
            return;
        }

        var session = await _authContext.GetSessionAsync(sessionId);
        if (session is null)
        {
            context.Fail(new AuthorizationFailureReason(this, "Session not found."));
            context.Fail();
            return;
        }

        if (!session.IsLive(DateTimeOffset.UtcNow))
        {
            context.Fail(new AuthorizationFailureReason(this, "Session is revoked or expired."));
            context.Fail();
            return;
        }

        if (session.TokenVersion != tokenVersion)
        {
            context.Fail(new AuthorizationFailureReason(this, "Session token version mismatch."));
            context.Fail();
            return;
        }

        var user = await _authContext.GetUserAsync(session.UserId);
        if (!Guid.TryParse(context.User.FindFirst("sub")?.Value, out var userId) || userId != session.UserId ||
            user is null || !user.IsActive || user.IsBanned || user.DeletedAt is not null)
        {
            context.Fail(new AuthorizationFailureReason(this, "Account cannot access the archive."));
            return;
        }

        if (!user.CanAccessArchive(DateTimeOffset.UtcNow))
        {
            context.Fail(new AuthorizationFailureReason(this, ArchiveRestrictedReason));
            return;
        }

        context.Succeed(requirement);
    }
}
