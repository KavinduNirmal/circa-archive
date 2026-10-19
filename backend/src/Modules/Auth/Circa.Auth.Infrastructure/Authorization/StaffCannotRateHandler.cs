using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace Circa.Auth.Infrastructure.Authorization;

public sealed class StaffCannotRateHandler : AuthorizationHandler<StaffCannotRateRequirement>
{
    private readonly IAuthRequestContext _authContext;

    public StaffCannotRateHandler(IAuthRequestContext authContext)
    {
        _authContext = authContext;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        StaffCannotRateRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var role = context.User.FindFirst("role")?.Value;
        if (string.Equals(role, "moderator", StringComparison.OrdinalIgnoreCase))
        {
            context.Fail(new AuthorizationFailureReason(this, "Staff/moderators are prohibited from rating or voting."));
            return;
        }

        var subStr = context.User.FindFirst("sub")?.Value;
        if (Guid.TryParse(subStr, out var userId))
        {
            var user = await _authContext.GetUserAsync(userId);
            if (user is not null && string.Equals(user.Role, "moderator", StringComparison.OrdinalIgnoreCase))
            {
                context.Fail(new AuthorizationFailureReason(this, "Staff/moderators are prohibited from rating or voting."));
                return;
            }
        }

        context.Succeed(requirement);
    }
}
