using Circa.Archive.Application;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchRequestTests
{
    [Fact]
    public void DefaultsToEnglishNewestAndFirstTwentyResults()
    {
        var result = SearchRequestValidator.Parse(new Dictionary<string, string[]>());
        Assert.Empty(result.Errors);
        var request = Assert.IsType<SearchRequest>(result.Request);
        Assert.Equal(("en", "newest", 1, 20), (request.Language, request.Sort, request.Page, request.Limit));
    }

    [Fact]
    public void NormalizesRepeatedAndCommaSeparatedFiltersAndLanguageAlias()
    {
        var result = Parse(("q", [" door "]), ("holder", [" CIRCA-A "]),
            ("type", ["record,incident", "record"]), ("lang", ["ko"]));
        var request = Assert.IsType<SearchRequest>(result.Request);
        Assert.Empty(result.Errors);
        Assert.Equal("door", request.Query);
        Assert.Equal("CIRCA-A", request.Holder);
        Assert.Equal("relevance", request.Sort);
        Assert.Equal("ko", request.Language);
        Assert.Equal(["incident", "record"], request.Filters["type"]);
    }

    [Theory]
    [InlineData("page", "0")]
    [InlineData("page", "101")]
    [InlineData("page", "1.5")]
    [InlineData("limit", "25")]
    [InlineData("language", "fr")]
    [InlineData("type", "memo")]
    [InlineData("status", "published")]
    [InlineData("from", "2026-02-30")]
    [InlineData("from", "2026-1-01")]
    [InlineData("sort", "title; DROP TABLE records")]
    [InlineData("warnTag", "unknown")]
    public void RejectsInvalidValues(string key, string value)
    {
        var result = Parse((key, [value]));
        Assert.Null(result.Request);
        Assert.Contains(key, result.Errors.Keys);
    }

    [Fact]
    public void RejectsOversizedTextArraysAndReversedDates()
    {
        var result = Parse(("q", [new string('a', 201)]), ("holder", [new string('b', 121)]),
            ("type", Enumerable.Repeat("record", 21).ToArray()),
            ("from", ["2026-10-25"]), ("to", ["2026-10-24"]));
        Assert.Null(result.Request);
        foreach (var key in new[] { "q", "holder", "type", "to" }) Assert.Contains(key, result.Errors.Keys);
    }

    [Fact]
    public void CanonicalLanguageOverridesAliasAndExclusionOverridesInclusion()
    {
        var result = Parse(("language", ["en"]), ("lang", ["ko"]),
            ("warnTag", ["self-harm"]), ("excludeWarnTag", ["self-harm"]));
        var request = Assert.IsType<SearchRequest>(result.Request);
        Assert.Equal("en", request.Language);
        Assert.Empty(request.Filters["warnTag"]);
        Assert.Equal(["self-harm"], request.Filters["excludeWarnTag"]);
    }

    private static SearchValidationResult Parse(params (string Key, string[] Values)[] values)
        => SearchRequestValidator.Parse(values.ToDictionary(value => value.Key, value => value.Values));
}
