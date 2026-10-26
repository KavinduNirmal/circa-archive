using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;

namespace Circa.Archive.Infrastructure.Search;

internal sealed class SearchRateLimiting(IConfiguration configuration) : IRateLimiterPolicy<string>
{
    public RateLimitPartition<string> GetPartition(HttpContext context)
    {
        var authenticated = context.User.Identity?.IsAuthenticated == true &&
            Guid.TryParse(context.User.FindFirst("sub")?.Value, out _);
        var key = authenticated ? $"user:{context.User.FindFirst("sub")!.Value}" : $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
        return RateLimitPartition.GetFixedWindowLimiter(key,
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = Math.Clamp(authenticated ? configuration.GetValue("Search:AuthenticatedPermitLimit", 120) : configuration.GetValue("Search:PermitLimit", 60), 1, 10000),
            Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true
        });
    }

    public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected => async (context, token) =>
    {
        SearchEndpoints.SetCacheHeaders(context.HttpContext.Response);
        var retry = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var after) ? after : TimeSpan.FromMinutes(1);
        context.HttpContext.Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(retry.TotalSeconds)).ToString(CultureInfo.InvariantCulture);
        await Results.Problem(statusCode: 429, title: "Too Many Requests",
            extensions: new Dictionary<string, object?> { ["code"] = "rate_limit_exceeded" }).ExecuteAsync(context.HttpContext);
    };
}
