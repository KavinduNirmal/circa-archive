using System.Globalization;

namespace Circa.Archive.Application;

public sealed record SearchRequest(
    string Query, string Holder, IReadOnlyDictionary<string, string[]> Filters,
    string Period, DateOnly? From, DateOnly? To, string Language, string Sort, int Page, int Limit,
    SearchCursor? Cursor = null, string CursorToken = "");

public sealed record SearchValidationResult(SearchRequest? Request, IReadOnlyDictionary<string, string[]> Errors);

public static class SearchRequestValidator
{
    private static readonly string[] WarningTags =
        ["graphic-violence", "psychological-horror", "sexual-violence", "self-harm", "major-character-death"];

    private static readonly IReadOnlyDictionary<string, string[]> Facets = new Dictionary<string, string[]>
    {
        ["type"] = ["incident", "record", "organization", "character", "recovery"],
        ["class"] = ["incident", "exploration", "evidence", "rumour"],
        ["status"] = ["on-file", "contested", "sealed", "restricted", "erased", "tombstoned"],
        ["lifecycle"] = ["on-file", "erased", "tombstoned"],
        ["access"] = ["public", "sealed", "restricted"],
        ["advisory"] = ["contested", "none"],
        ["warn"] = ["red", "yellow", "green"],
        ["disclosure"] = ["none", "no-warnings-apply", "not-provided"],
        ["warnTag"] = WarningTags,
        ["excludeWarnTag"] = WarningTags,
        ["custody"] = ["unknown", "unclaimed", "claimed", "disputed", "lost", "destroyed"]
    };

    public static SearchValidationResult Parse(IReadOnlyDictionary<string, string[]> input)
    {
        var errors = new Dictionary<string, string[]>();
        var filters = new Dictionary<string, string[]>();
        void Reject(string key, string message) => errors[key] = [message];

        string Scalar(string key, string fallback = "")
        {
            if (!input.TryGetValue(key, out var values) || values.Length == 0) return fallback;
            if (values.Length > 1) Reject(key, "Supply one value.");
            if (values[0].Any(char.IsControl)) Reject(key, "Control characters are not allowed.");
            var value = values[0].Trim();
            return value.Length == 0 ? fallback : value;
        }

        string Choice(string key, string fallback, params string[] choices)
        {
            var value = Scalar(key, fallback);
            if (!choices.Contains(value, StringComparer.Ordinal)) Reject(key, "Unknown value.");
            return value;
        }

        DateOnly? Date(string key)
        {
            var value = Scalar(key);
            if (value.Length == 0) return null;
            if (DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var date)) return date;
            Reject(key, "Use a valid YYYY-MM-DD date.");
            return null;
        }

        foreach (var (key, options) in Facets)
        {
            var values = input.TryGetValue(key, out var raw)
                ? raw.SelectMany(value => value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)).ToArray()
                : [];
            if (values.Length > 20) Reject(key, "Supply at most 20 values.");
            if (values.Except(options, StringComparer.Ordinal).Any()) Reject(key, "Unknown value.");
            filters[key] = options.Where(option => values.Contains(option, StringComparer.Ordinal)).ToArray();
        }
        filters["warnTag"] = filters["warnTag"].Except(filters["excludeWarnTag"], StringComparer.Ordinal).ToArray();

        var query = Scalar("q");
        var holder = Scalar("holder");
        foreach (var (key, maxLength) in new Dictionary<string, int>
        {
            ["mention"] = 120, ["org"] = 120, ["author"] = 64, ["tag"] = 64, ["character"] = 120
        })
        {
            var value = Scalar(key);
            if (value.Length > maxLength) Reject(key, $"Use at most {maxLength} characters.");
            filters[key] = value.Length == 0 ? [] : [value];
        }
        filters["custody"] = Choice("custody", "", "", "unknown", "unclaimed", "claimed", "disputed", "lost", "destroyed") is { Length: > 0 } custody
            ? [custody]
            : [];
        if (query.Length > 200) Reject("q", "Use at most 200 characters.");
        if (holder.Length > 120) Reject("holder", "Use at most 120 characters.");
        var from = Date("from");
        var to = Date("to");
        if (from > to) Reject("to", "Must be on or after from.");
        var period = Choice("period", "any", "any", "current", "recent", "historical");
        var languageKey = input.ContainsKey("language") ? "language" : "lang";
        var language = Choice(languageKey, "en", "en", "ko");
        var sort = Choice("sort", query.Length > 0 || holder.Length > 0 ? "relevance" : "newest",
            "relevance", "newest", "oldest", "title");
        if (!int.TryParse(Scalar("page", "1"), NumberStyles.None, CultureInfo.InvariantCulture, out var page)
            || page is < 1 or > 100) Reject("page", "Use an integer from 1 to 100.");
        if (!int.TryParse(Scalar("limit", "20"), NumberStyles.None, CultureInfo.InvariantCulture, out var limit)
            || limit is not (10 or 20 or 50)) Reject("limit", "Use 10, 20, or 50.");

        var cursorToken = Scalar("cursor");
        SearchCursor? cursor = null;
        if (cursorToken.Length > 2048 || (cursorToken.Length > 0 &&
            (!System.Text.RegularExpressions.Regex.IsMatch(cursorToken, "^[A-Za-z0-9_-]{16,2048}$") ||
             !SearchCursorCodec.TryDecode(cursorToken, out cursor))))
            Reject("cursor", "Use a valid continuation cursor.");
        if (cursor is not null && cursor.Sort != sort) Reject("cursor", "The cursor does not match the selected sort order.");

        return new(errors.Count == 0
            ? new(query, holder, filters, period, from, to, language, sort, cursor?.Page ?? page, limit, cursor, cursorToken)
            : null, errors);
    }
}
