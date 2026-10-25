using Circa.Archive.Application;
using Npgsql;
using NpgsqlTypes;

namespace Circa.Archive.Infrastructure.Search;

internal static class SearchSqlBuilder
{
    public static NpgsqlCommand Build(SearchRequest request, Guid? viewerId, NpgsqlConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandTimeout = 5;
        void Text(string key, string value) => command.Parameters.AddWithValue(key, NpgsqlDbType.Text, value);
        Text("q", request.Query);
        Text("pattern", "%" + EscapeLike(request.Query) + "%");
        Text("prefix", EscapeLike(request.Query) + "%");
        Text("holder", request.Holder.ToLowerInvariant());
        Text("holderPrefix", EscapeLike(request.Holder.ToLowerInvariant()) + "%");
        Text("code", SearchCode.Parse(request.Query)?.Canonical ?? request.Query.ToUpperInvariant());
        command.Parameters.AddWithValue("viewer", NpgsqlDbType.Uuid, (object?)viewerId ?? DBNull.Value);
        command.Parameters.AddWithValue("limit", request.Limit);
        command.Parameters.AddWithValue("offset", (request.Page - 1) * request.Limit);
        var common = new List<string>();
        if (request.Query.Length > 0)
        {
            var vocabulary = SearchVocabulary.Resolve(request.Query, request.Language);
            Text("vocabKey", vocabulary?.Key ?? "");
            Text("vocabValue", vocabulary?.Value ?? "");
            var fts = request.Language == "en" ? "OR search_vector @@ websearch_to_tsquery('english', @q)" : "";
            common.Add($"""
                (upper(code) = @code OR upper(legacy_code) = @code OR code ILIKE @prefix
                OR title ILIKE @pattern OR parent_code ILIKE @pattern
                OR search_text ILIKE @pattern OR search_text % @q
                {fts}
                OR CASE @vocabKey WHEN 'type' THEN entity_type = @vocabValue
                    WHEN 'class' THEN filing_class = @vocabValue
                    WHEN 'status' THEN display_status = @vocabValue
                    WHEN 'warn' THEN warning_tier = @vocabValue
                    WHEN 'disclosure' THEN warning_disclosure = @vocabValue
                    WHEN 'warnTag' THEN @vocabValue = ANY(warning_tags) ELSE false END)
                """);
        }
        if (request.Holder.Length > 0) common.Add("lower(holder_code) LIKE @holderPrefix");
        void DateBound(string name, DateOnly date, string predicate)
        {
            command.Parameters.AddWithValue(name, NpgsqlDbType.TimestampTz,
                new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)));
            common.Add(predicate);
        }
        if (request.From is { } from) DateBound("from", from, "filed_at >= @from");
        if (request.To is { } to) DateBound("to", to, "filed_at < @to + interval '1 day'");
        if (request.Period == "current") common.Add("filed_at >= TIMESTAMPTZ '2000-01-01 00:00:00+00'");
        if (request.Period == "recent") common.Add("filed_at >= TIMESTAMPTZ '1900-01-01 00:00:00+00' AND filed_at < TIMESTAMPTZ '2000-01-01 00:00:00+00'");
        if (request.Period == "historical") common.Add("filed_at < TIMESTAMPTZ '1900-01-01 00:00:00+00'");
        var filters = new List<string>();
        var columns = new Dictionary<string, string>
        {
            ["type"] = "entity_type", ["class"] = "filing_class", ["access"] = "access_policy",
            ["advisory"] = "coalesce(advisory, 'none')", ["warn"] = "warning_tier",
            ["disclosure"] = "warning_disclosure", ["lifecycle"] = "replace(record_status, '_', '-')"
        };
        foreach (var (key, values) in request.Filters.Where(x => x.Value.Length > 0))
        {
            command.Parameters.AddWithValue(key, NpgsqlDbType.Array | NpgsqlDbType.Text, values);
            if (columns.TryGetValue(key, out var column)) filters.Add($"{column} = ANY(@{key})");
            else if (key == "warnTag") filters.Add("warning_tags && @warnTag");
            else if (key == "excludeWarnTag") filters.Add("NOT (warning_tags && @excludeWarnTag)");
            else if (key == "status")
            {
                var predicates = values.Select(value => value switch
                {
                    "on-file" => "(access_policy = 'public' AND advisory IS NULL)",
                    "contested" => "(access_policy = 'public' AND advisory = 'contested')",
                    "sealed" => "access_policy = 'sealed'",
                    _ => "false"
                });
                filters.Add("(" + string.Join(" OR ", predicates) + ")");
            }
        }
        var rank = request.Query.Length == 0 ? "0::real" : $"""
            CASE WHEN upper(code) = @code OR upper(legacy_code) = @code THEN 1000
                WHEN code ILIKE @prefix THEN 800 WHEN lower(title) = lower(@q) THEN 600
                WHEN title ILIKE @prefix THEN 500 ELSE 0 END
            + {(request.Language == "en" ? "ts_rank_cd(search_vector, websearch_to_tsquery('english', @q)) * 100 +" : "")}
            similarity(search_text, @q) * 50
            """;
        var order = request.Sort switch
        {
            "oldest" => "filed_at ASC, id ASC",
            "title" => "lower(title) ASC, id ASC",
            "relevance" => $"{(request.Holder.Length > 0 ? "(lower(holder_code) = @holder) DESC, " : "")}relevance DESC, filed_at DESC, id DESC",
            _ => "filed_at DESC, id DESC"
        };
        command.CommandText = $$"""
            WITH docs AS NOT MATERIALIZED (
                {{Documents}}
            ), common AS MATERIALIZED (
                SELECT *, {{rank}} AS relevance FROM docs
                WHERE {{(common.Count == 0 ? "true" : string.Join(" AND ", common))}}
            ), filtered AS MATERIALIZED (
                SELECT * FROM common WHERE {{(filters.Count == 0 ? "true" : string.Join(" AND ", filters))}}
            ), page AS (
                SELECT * FROM filtered ORDER BY {{order}} LIMIT @limit OFFSET @offset
            ), facet_values AS (
                SELECT v.key, v.value FROM common
                CROSS JOIN LATERAL (VALUES ('type', entity_type), ('class', filing_class),
                    ('status', display_status), ('warn', warning_tier), ('disclosure', warning_disclosure),
                    ('period', CASE WHEN filed_at >= TIMESTAMPTZ '2000-01-01 00:00:00+00' THEN 'current'
                        WHEN filed_at >= TIMESTAMPTZ '1900-01-01 00:00:00+00' THEN 'recent' ELSE 'historical' END)
                ) v(key, value) WHERE v.value IS NOT NULL
                UNION ALL SELECT 'warnTag', unnest(warning_tags) FROM common
            ), facet_counts AS (
                SELECT key, value, count(*) AS count FROM facet_values GROUP BY key, value
            ), ranked_facets AS (
                SELECT *, row_number() OVER (PARTITION BY key ORDER BY count DESC, value) AS position FROM facet_counts
            ), facets AS (
                SELECT key, jsonb_agg(jsonb_build_object('value', value, 'count', count) ORDER BY value) AS values
                FROM ranked_facets WHERE key <> 'warnTag' OR position <= 20 GROUP BY key
            )
            SELECT jsonb_build_object(
                'rows', coalesce((SELECT jsonb_agg(to_jsonb(page) - 'search_vector' - 'search_text' - 'relevance') FROM page), '[]'::jsonb),
                'total', (SELECT count(*) FROM filtered),
                'facets', coalesce((SELECT jsonb_object_agg(key, values) FROM facets), '{}'::jsonb),
                'exact', EXISTS(SELECT 1 FROM docs WHERE upper(code) = @code OR upper(legacy_code) = @code),
                'holder_exact', EXISTS(SELECT 1 FROM filtered WHERE lower(holder_code) = @holder)
            )::text;
            """;
        return command;
    }

    private static string EscapeLike(string value) => value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private const string Documents = """
        SELECT 'incident'::text entity_type, 'incident'::text filing_class, i.id,
            'INC-' || lpad(i.reference_number::text, greatest(6, length(i.reference_number::text)), '0') code,
            NULL::text legacy_code, i.reference_number, i.designation title,
            CASE WHEN i.access_policy = 'sealed' THEN NULL ELSE left(i.markdown, 4096) END body,
            i.created_at filed_at, i.record_status, i.access_policy,
            NULL::text advisory, CASE WHEN i.access_policy = 'sealed' THEN 'sealed' ELSE 'on-file' END display_status,
            i.warning_tier, replace(i.warning_disclosure, '_', '-') warning_disclosure, i.warning_tags, i.holder_code,
            NULL::text parent_code, NULL::text parent_title, i.access_policy = 'sealed' redacted,
            CASE WHEN i.access_policy = 'sealed' THEN to_tsvector('english', i.designation) ELSE i.search_vector END search_vector,
            CASE WHEN i.access_policy = 'sealed' THEN i.designation ELSE i.search_text END search_text
        FROM archive.incidents i WHERE i.record_status = 'on_file' AND i.access_policy IN ('public', 'sealed')
        UNION ALL
        SELECT 'record', CASE r.record_type WHEN 'EXP' THEN 'exploration' WHEN 'EVI' THEN 'evidence' ELSE 'rumour' END,
            r.id, r.code, NULL, r.reference_number, i.designation,
            CASE WHEN r.access_policy = 'sealed' AND NOT approval.allowed THEN NULL ELSE left(r.markdown, 4096) END,
            r.created_at, r.record_status, r.access_policy,
            CASE WHEN assessments.contested THEN 'contested' ELSE NULL END,
            CASE WHEN r.access_policy = 'sealed' THEN 'sealed' WHEN assessments.contested THEN 'contested' ELSE 'on-file' END,
            r.warning_tier, replace(r.warning_disclosure, '_', '-'), r.warning_tags, r.holder_code,
            'INC-' || lpad(i.reference_number::text, greatest(6, length(i.reference_number::text)), '0'), i.designation,
            r.access_policy = 'sealed' AND NOT approval.allowed,
            CASE WHEN r.access_policy = 'sealed' AND NOT approval.allowed THEN to_tsvector('english', i.designation) ELSE r.search_vector END,
            CASE WHEN r.access_policy = 'sealed' AND NOT approval.allowed THEN i.designation ELSE r.search_text END
        FROM archive.records r JOIN archive.incidents i ON i.id = r.incident_id
        LEFT JOIN LATERAL (
            SELECT count(*) >= 10 AND count(*) FILTER (WHERE assessment = 'contest') * 10 >= count(*) * 7 AS contested
            FROM archive.record_assessments WHERE record_id = r.id
        ) assessments ON true
        CROSS JOIN LATERAL (
            SELECT EXISTS(SELECT 1 FROM archive.record_access_requests a
                WHERE a.record_id = r.id AND a.requester_id = @viewer AND a.status = 'approved' AND a.decided_at IS NOT NULL) AS allowed
        ) approval
        WHERE r.record_status = 'on_file' AND r.access_policy IN ('public', 'sealed')
            AND NOT EXISTS(SELECT 1 FROM archive.tombstones t WHERE t.record_id = r.id)
            AND i.record_status = 'on_file' AND i.access_policy IN ('public', 'sealed')
        UNION ALL
        SELECT 'organization', NULL, o.id,
            'ORG-' || lpad(o.reference_number::text, greatest(6, length(o.reference_number::text)), '0'), o.legacy_code,
            o.reference_number, o.name, left(o.markdown, 4096), o.filed_at, o.record_status, 'public', NULL, 'on-file',
            NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, false, o.search_vector, o.search_text
        FROM archive.organizations o WHERE o.record_status = 'on_file'
        UNION ALL
        SELECT 'character', NULL, c.id,
            'CHR-' || lpad(c.reference_number::text, greatest(6, length(c.reference_number::text)), '0'), NULL,
            c.reference_number, c.name, left(c.markdown, 4096), c.created_at, c.record_status, 'public', NULL, 'on-file',
            NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, false, c.search_vector, c.search_text
        FROM archive.characters c WHERE c.record_status = 'on_file'
        UNION ALL
        SELECT 'recovery', NULL, r.id,
            'ITM-' || lpad(r.reference_number::text, greatest(6, length(r.reference_number::text)), '0'), NULL,
            r.reference_number, r.name, left(r.description, 4096), r.created_at, 'on_file', 'public', NULL, 'on-file',
            NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, false, r.search_vector, r.search_text
        FROM archive.recoveries r WHERE r.registry_status = 'active'
        """;
}
