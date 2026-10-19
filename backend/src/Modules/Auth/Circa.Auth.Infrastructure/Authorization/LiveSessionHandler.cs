using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace Circa.Auth.Infrastructure.Authorization;

public sealed class LiveSessionHandler : AuthorizationHandler<LiveSessionRequirement>
{
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

        context.Succeed(requirement);
    }
}
