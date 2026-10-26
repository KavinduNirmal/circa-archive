using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Npgsql;

namespace Circa.Archive.Infrastructure.Search;

public static class ArchiveDestinationEndpoints
{
    public static RouteGroupBuilder MapArchiveDestinationEndpoints(this RouteGroupBuilder api, Func<HttpContext, Task<Guid?>> resolveViewer, string writesPolicy)
    {
        var group = api.MapGroup("/archive").RequireRateLimiting("archive_search");
        group.AddEndpointFilter(async (invocation, next) =>
        {
            SearchEndpoints.SetCacheHeaders(invocation.HttpContext.Response);
            try { return await next(invocation); }
            catch (OperationCanceledException) when (invocation.HttpContext.RequestAborted.IsCancellationRequested) { throw; }
            catch (Exception error) when (error is NpgsqlException or TimeoutException)
            {
                return Results.Problem(statusCode: 503, title: "Archive unavailable");
            }
            catch (Exception)
            {
                return Results.Problem(statusCode: 500, title: "Archive request failed");
            }
        });
        group.MapGet("/{code}", async (string code, HttpContext context, ArchiveDestinationReader reader) =>
        {
            SearchEndpoints.SetCacheHeaders(context.Response);
            var destination = await reader.ReadAsync(code, await resolveViewer(context),
                context.Request.Query["acknowledge"] == "true", context.RequestAborted);
            return destination is null ? Results.NotFound() : Results.Ok(destination);
        }).AllowAnonymous();
        group.MapPost("/{code}/access-requests", async (string code, HttpContext context, ArchiveDestinationReader reader) =>
        {
            SearchEndpoints.SetCacheHeaders(context.Response);
            var viewer = await resolveViewer(context);
            if (viewer is null) return Results.Unauthorized();
            var status = await reader.RequestAccessAsync(code, viewer.Value, context.RequestAborted);
            return status is null ? Results.NotFound() : Results.Ok(new { status });
        }).RequireAuthorization(writesPolicy);
        return group;
    }
}
