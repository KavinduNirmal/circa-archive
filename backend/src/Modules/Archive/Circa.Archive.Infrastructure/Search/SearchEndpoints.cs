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
        extensions: new Dictionary<string, object?> { ["code"] = errors.ContainsKey("cursor") ? "invalid_cursor" : "invalid_search_filter", ["errors"] = errors });

    private static void SetLinks(HttpContext context, SearchPage page)
    {
        // Preserve all repeated query values, while canonicalizing the language alias.
        var values = context.Request.Query.Where(x => x.Key is not ("page" or "cursor" or "lang"))
            .SelectMany(x => x.Value.Select(value => new KeyValuePair<string, string?>(x.Key, value))).ToList();
        if (!context.Request.Query.ContainsKey("language") && context.Request.Query.TryGetValue("lang", out var alias))
            values.Add(new("language", alias.ToString()));
        string PageLink(int number, string relation)
        {
            var query = QueryString.Create(values.Append(new("page", number.ToString(System.Globalization.CultureInfo.InvariantCulture))));
            return $"<{context.Request.PathBase}{context.Request.Path}{query}>; rel=\"{relation}\"";
        }
        string CursorLink(string? cursor, string relation)
        {
            IEnumerable<KeyValuePair<string, string?>> queryValues = values;
            if (cursor is null) queryValues = values.Append(new("page", "1"));
            else if (cursor.Length > 0) queryValues = values.Append(new("cursor", cursor));
            return $"<{context.Request.PathBase}{context.Request.Path}{QueryString.Create(queryValues)}>; rel=\"{relation}\"";
        }
        var last = Math.Clamp(page.TotalPages, 1, 100);
        var cursorRequest = context.Request.Query.ContainsKey("cursor");
        var links = new List<string> { PageLink(1, "first") };
        if (!cursorRequest && page.Number > 1)
            links.Add(PageLink(page.Number - 1, "prev"));
        if (!cursorRequest && page.TotalPages > 1)
            links.Add(PageLink(last, "last"));
        if (cursorRequest && page.PreviousCursor is not null)
            links.Add(page.PreviousCursor.Length == 0 ? PageLink(Math.Max(1, page.Number - 1), "prev") : CursorLink(page.PreviousCursor, "prev"));
        if (page.NextCursor is not null) links.Add(CursorLink(page.NextCursor, "next"));
        context.Response.Headers.Link = string.Join(", ", links);
    }
}
