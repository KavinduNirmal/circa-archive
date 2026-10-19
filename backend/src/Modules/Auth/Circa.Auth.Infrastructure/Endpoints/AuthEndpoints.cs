using Circa.Auth.Application;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Circa.Auth.Infrastructure.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").AllowAnonymous();

        group.MapPost("/register", async (RegisterRequest request, RegisterHandler handler, CancellationToken ct) =>
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

            return Results.Created($"/api/auth/users/{result.Value!.Id}", result.Value);
        });

        group.MapPost("/login", async (LoginRequest request, LoginHandler handler, HttpContext httpContext, CancellationToken ct) =>
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

            return Results.Ok(result.Value);
        });

        return endpoints;
    }
}
