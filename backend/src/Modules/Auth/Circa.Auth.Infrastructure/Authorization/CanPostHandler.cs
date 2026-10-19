using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace Circa.Auth.Infrastructure.Authorization;

public sealed class CanPostHandler : AuthorizationHandler<CanPostRequirement>
{
    private readonly IAuthRequestContext _authContext;

    public CanPostHandler(IAuthRequestContext authContext)
    {
        _authContext = authContext;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CanPostRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var subStr = context.User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(subStr, out var userId))
        {
            context.Fail(new AuthorizationFailureReason(this, "User ID claim (sub) missing or invalid."));
            return;
        }

        var user = await _authContext.GetUserAsync(userId);
        if (user is null)
        {
            context.Fail(new AuthorizationFailureReason(this, "User not found."));
            return;
        }

        if (!user.CanPost(DateTimeOffset.UtcNow))
        {
            context.Fail(new AuthorizationFailureReason(this, "User has active posting restrictions."));
            return;
        }

        context.Succeed(requirement);
    }
}
