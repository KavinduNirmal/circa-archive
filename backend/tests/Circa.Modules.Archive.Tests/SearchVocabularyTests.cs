using Circa.Archive.Application;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchVocabularyTests
{
    [Theory]
    [InlineData(" SeAlEd ", "en", "status", "sealed")]
    [InlineData("봉인됨", "ko", "status", "sealed")]
    [InlineData("탐사", "ko", "class", "exploration")]
    [InlineData("psychological-horror", "ko", "warnTag", "psychological-horror")]
    [InlineData("No warnings apply", "en", "disclosure", "no-warnings-apply")]
    public void ResolvesExactDisplayLabelsAndCanonicalTokens(string query, string language, string key, string value)
        => Assert.Equal(new SearchVocabularyMatch(key, value), SearchVocabulary.Resolve(query, language));

    [Theory]
    [InlineData("unsealed", "en")]
    [InlineData("Sealed doors", "en")]
    [InlineData("봉인됨", "en")]
    public void DoesNotTreatSubstringsOrOtherLanguageLabelsAsFilters(string query, string language)
        => Assert.Null(SearchVocabulary.Resolve(query, language));
}
