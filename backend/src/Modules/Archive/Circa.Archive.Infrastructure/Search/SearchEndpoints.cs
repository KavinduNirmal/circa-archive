using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Circa.Archive.Application;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Circa.Archive.Infrastructure.Search;

public static class SearchEndpoints
{
    public static RouteHandlerBuilder MapSearchEndpoints(this RouteGroupBuilder api, Func<HttpContext, Task<Guid?>> resolveViewer)
    {
        return api.MapGet("/search", (HttpContext context, SearchReader reader, ILogger<SearchReader> logger) =>
                HandleAsync(context, reader, logger, resolveViewer))
            .AllowAnonymous()
            .RequireRateLimiting("archive_search");
    }

    internal static void SetCacheHeaders(HttpResponse response)
    {
        response.Headers.CacheControl = "private, no-store";
        response.Headers.Append("Vary", "Cookie");
    }

    private static async Task<IResult> HandleAsync(HttpContext context, SearchReader reader, ILogger<SearchReader> logger, Func<HttpContext, Task<Guid?>> resolveViewer)
    {
        SetCacheHeaders(context.Response);
        if (Encoding.UTF8.GetByteCount(context.Request.Path + context.Request.QueryString.Value) > 4096)
            return Invalid(new Dictionary<string, string[]> { ["query"] = ["The URL must be at most 4096 bytes."] });
        var input = context.Request.Query.ToDictionary(x => x.Key, x => x.Value.Select(value => value ?? "").ToArray(), StringComparer.Ordinal);
        var validation = SearchRequestValidator.Parse(input);
        if (validation.Request is not { } request) return Invalid(validation.Errors);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Query)))[..16];
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var viewer = await resolveViewer(context);
            var response = await reader.SearchAsync(request, viewer, context.RequestAborted);
            SetLinks(context, response.Page);
            logger.LogInformation("Archive search {QueryHash} filters {FilterKeys} returned {Count} in {ElapsedMs} ms for {ViewerKind}",
                hash, string.Join(',', request.Filters.Where(x => x.Value.Length > 0).Select(x => x.Key).Order()), response.Page.Total, stopwatch.ElapsedMilliseconds, viewer is null ? "guest" : "reader");
            return Results.Ok(response);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { throw; }
        catch (Exception error) when (error is NpgsqlException or TimeoutException)
        {
            var timeout = error is PostgresException { SqlState: "57014" } || error is TimeoutException || error.InnerException is TimeoutException;
            logger.LogWarning("Archive search {QueryHash} failed with {FailureKind}", hash, timeout ? "timeout" : "database");
            return Results.Problem(statusCode: 503, title: "Search unavailable",
                extensions: new Dictionary<string, object?> { ["code"] = "search_unavailable" });
        }
        catch (Exception error)
        {
            logger.LogError("Archive search {QueryHash} failed with {FailureKind}", hash, error.GetType().Name);
            return Results.Problem(statusCode: 500, title: "Search failed",
                extensions: new Dictionary<string, object?> { ["code"] = "search_failed" });
        }
    }

    private static IResult Invalid(IReadOnlyDictionary<string, string[]> errors) => Results.Problem(
        statusCode: 400, title: "Invalid search filter",
        extensions: new Dictionary<string, object?> { ["code"] = "invalid_search_filter", ["errors"] = errors });

    private static void SetLinks(HttpContext context, SearchPage page)
    {
        // Preserve all repeated query values, while canonicalizing the language alias.
        var values = context.Request.Query.Where(x => x.Key is not ("page" or "lang"))
            .SelectMany(x => x.Value.Select(value => new KeyValuePair<string, string?>(x.Key, value))).ToList();
        if (!context.Request.Query.ContainsKey("language") && context.Request.Query.TryGetValue("lang", out var alias))
            values.Add(new("language", alias.ToString()));
        string Link(int number, string relation)
        {
            var query = QueryString.Create(values.Append(new("page", number.ToString(System.Globalization.CultureInfo.InvariantCulture))));
            return $"<{context.Request.PathBase}{context.Request.Path}{query}>; rel=\"{relation}\"";
        }
        var last = Math.Clamp(page.TotalPages, 1, 100);
        var links = new List<string> { Link(1, "first"), Link(last, "last") };
        if (page.Number > 1) links.Add(Link(Math.Min(page.Number - 1, last), "prev"));
        if (page.Number < last) links.Add(Link(page.Number + 1, "next"));
        context.Response.Headers.Link = string.Join(", ", links);
    }
}
