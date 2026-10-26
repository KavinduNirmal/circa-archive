namespace Circa.Archive.Application;

public sealed record SearchResponse(
    IReadOnlyList<SearchItem> Items, SearchPage Page,
    IReadOnlyDictionary<string, SearchFacet[]> Facets,
    IReadOnlyDictionary<string, object?> Applied, SearchMeta Meta);

public sealed record SearchItem(
    Guid Id, string Type, string? Class, string? Code, string DisplayCode, string Title,
    string? Excerpt, SearchHighlight[] Highlights, DateTimeOffset FiledAt,
    string Status, string Lifecycle, string Access, string? Advisory,
    SearchWarning Warning, SearchHolder? Holder, SearchParent? Parent,
    long ReferenceNumber, bool Redacted);
public sealed record SearchHighlight(int Start, int End);
public sealed record SearchWarning(string? Tier, string? Disclosure, string[] Tags);
public sealed record SearchHolder(string HolderCode);
public sealed record SearchParent(string Type, string Code, string Title);
public sealed record SearchPage(int Number, int Size, long Total, int TotalPages,
    string? NextCursor = null, string? PreviousCursor = null);
public sealed record SearchFacet(string Value, long Count);
public sealed record SearchMeta(string? CodeMatch, string HolderMatch, string Language);
