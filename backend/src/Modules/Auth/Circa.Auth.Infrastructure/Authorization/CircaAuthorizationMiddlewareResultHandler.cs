using Circa.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/problem+json";
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Unauthorized",
                    Detail = "Session is revoked or expired."
                };
                problem.Extensions["code"] = "session_expired";
                await context.Response.WriteAsJsonAsync(problem);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";
            var forbiddenProblem = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                Detail = "Access denied."
            };
            forbiddenProblem.Extensions["code"] = "forbidden";
            await context.Response.WriteAsJsonAsync(forbiddenProblem);
            return;
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
