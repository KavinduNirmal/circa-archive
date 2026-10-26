using System.Text.Json;
using Circa.Archive.Application;
using Circa.Archive.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Circa.Archive.Infrastructure.Search;

public sealed class SearchReader(ArchiveDbContext database)
{
    public async Task<SearchResponse> SearchAsync(SearchRequest request, Guid? viewerId = null, CancellationToken cancellationToken = default)
    {
        await database.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            var connection = (NpgsqlConnection)database.Database.GetDbConnection();
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            await using (var settings = new NpgsqlCommand("SET LOCAL statement_timeout = '3s'; SET LOCAL pg_trgm.similarity_threshold = 0.2", connection, transaction))
                await settings.ExecuteNonQueryAsync(cancellationToken);
            await using var command = SearchSqlBuilder.Build(request, viewerId, connection);
            command.Transaction = transaction;
            var json = (string)(await command.ExecuteScalarAsync(cancellationToken))!;
            await transaction.CommitAsync(cancellationToken);
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var items = root.GetProperty("rows").EnumerateArray().Select(row => Map(row, request.Query)).ToArray();
            var total = root.GetProperty("total").GetInt64();
            var nextCursor = root.GetProperty("next_cursor").ValueKind == JsonValueKind.Null
                ? null
                : SearchCursorCodec.Encode(ReadCursor(root.GetProperty("next_cursor"), request.Cursor));
            var previousCursor = request.Cursor?.Previous is { } previous
                ? SearchCursorCodec.Encode(previous with { Previous = previous.Previous })
                : request.Cursor is not null || request.Page > 1 ? "" : null;
            var facets = new Dictionary<string, SearchFacet[]>();
            foreach (var key in new[] { "type", "class", "status", "warn", "disclosure", "warnTag", "period" })
                facets[key] = root.GetProperty("facets").TryGetProperty(key, out var values)
                    ? values.EnumerateArray().Select(value => new SearchFacet(value.GetProperty("value").GetString()!, value.GetProperty("count").GetInt64())).ToArray()
                    : [];
            var code = SearchCode.Parse(request.Query);
            var codeMatch = code is null ? null : root.GetProperty("exact").GetBoolean() ? "exact" : code.Reserved ? "reserved" : "missing";
            var holderMatch = request.Holder.Length == 0 || total == 0 ? "none" : root.GetProperty("holder_exact").GetBoolean() ? "exact" : "prefix";
            var applied = request.Filters.ToDictionary(x => x.Key, x => (object?)x.Value);
            applied["q"] = request.Query;
            applied["holder"] = request.Holder.Length == 0 ? null : request.Holder;
            applied["from"] = request.From?.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
            applied["to"] = request.To?.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
            applied["period"] = request.Period;
            applied["language"] = request.Language;
            applied["sort"] = request.Sort;
            applied["page"] = request.Page;
            applied["limit"] = request.Limit;
            foreach (var key in new[] { "mention", "org", "author", "tag", "character", "custody" })
                applied[key] = request.Filters.GetValueOrDefault(key)?.FirstOrDefault();
            applied["cursor"] = request.CursorToken.Length == 0 ? null : request.CursorToken;
            var pageNumber = request.Cursor?.Page ?? request.Page;
            return new(items, new(pageNumber, request.Limit, total, (int)Math.Ceiling((double)total / request.Limit), nextCursor, previousCursor),
                facets, applied, new(codeMatch, holderMatch, request.Language));
        }
        finally
        {
            await database.Database.CloseConnectionAsync();
        }
    }

    private static SearchCursor ReadCursor(JsonElement value, SearchCursor? current)
    {
        var boundary = new SearchCursor(
            value.GetProperty("sort").GetString()!,
            value.GetProperty("filedAt").GetDateTimeOffset(),
            value.GetProperty("id").GetGuid(),
            value.GetProperty("score").GetDouble(),
            value.GetProperty("title").GetString()!,
            value.GetProperty("page").GetInt32());
        return boundary with { Previous = current is null ? null : current with { Previous = null } };
    }

    private static SearchItem Map(JsonElement row, string query)
    {
        string? Text(string name) => row.GetProperty(name).ValueKind == JsonValueKind.Null ? null : row.GetProperty(name).GetString();
        var redacted = row.GetProperty("redacted").GetBoolean();
        var excerpt = redacted ? null : SearchText.Excerpt(Text("body") ?? "");
        var type = Text("entity_type")!;
        var code = Text("code");
        return new(row.GetProperty("id").GetGuid(), type, Text("filing_class"), code,
            Text("legacy_code") ?? code ?? "RUM", Text("title")!, excerpt,
            excerpt is null ? [] : SearchText.Highlights(excerpt, query), row.GetProperty("filed_at").GetDateTimeOffset(),
            Text("display_status")!, Text("record_status")!, Text("access_policy")!, Text("advisory"),
            new(Text("warning_tier"), Text("warning_disclosure"), row.GetProperty("warning_tags").EnumerateArray().Select(x => x.GetString()!).ToArray()),
            Text("holder_code") is { } holder ? new(holder) : null,
            Text("parent_code") is { } parent ? new("incident", parent, Text("parent_title")!) : null,
            row.GetProperty("reference_number").GetInt64(), redacted);
    }
}
