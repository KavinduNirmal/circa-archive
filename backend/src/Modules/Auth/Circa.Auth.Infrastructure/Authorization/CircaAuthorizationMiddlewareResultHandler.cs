using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;

namespace Circa.Auth.Infrastructure.Authorization;

public sealed class CircaAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        // Revocation guarantee: if the session is not live / revoked / expired / version mismatch,
        // return 401 Unauthorized instead of 403 Forbidden.
        if (authorizeResult.Forbidden)
        {
            var isLiveSessionFailed =
                authorizeResult.AuthorizationFailure?.FailedRequirements.OfType<LiveSessionRequirement>().Any() == true ||
                authorizeResult.AuthorizationFailure?.FailureReasons.Any(r => r.Handler is LiveSessionHandler) == true;

            if (isLiveSessionFailed)
            {
                if (policy.AuthenticationSchemes.Count > 0)
                {
                    foreach (var scheme in policy.AuthenticationSchemes)
                    {
                        await context.ChallengeAsync(scheme);
                    }
                }
                else
                {
                    await context.ChallengeAsync();
                }
                return;
            }
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
