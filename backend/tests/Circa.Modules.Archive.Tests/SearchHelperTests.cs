using Circa.Archive.Application;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchHelperTests
{
    [Theory]
    [InlineData("inc-7540", "INC-007540", false)]
    [InlineData("EXP-288901", "EXP-288901", true)]
    [InlineData("EVI-035783", "EVI-035783", false)]
    [InlineData("ORG-5428", "ORG-005428", true)]
    [InlineData("ORG-A-081323", "ORG-A-081323", false)]
    [InlineData("CHR-018256", "CHR-018256", true)]
    [InlineData("ITM-000001", "ITM-000001", false)]
    public void ParsesCanonicalAndLegacyCodes(string input, string canonical, bool reserved)
    {
        var code = Assert.IsType<SearchCode>(SearchCode.Parse(input));
        Assert.Equal(canonical, code.Canonical);
        Assert.Equal(reserved, code.Reserved);
    }

    [Theory]
    [InlineData("RUM-000001")]
    [InlineData("INC--1")]
    [InlineData("INC-999999999999999999999999")]
    [InlineData("prefix INC-007540")]
    public void IgnoresNonCodes(string value) => Assert.Null(SearchCode.Parse(value));

    [Fact]
    public void ExcerptsAreBoundedPlainTextAndOffsetsUseUtf16()
    {
        var excerpt = SearchText.Excerpt("# 😀 Door\n\n**Open** the [gate](https://example.test). <script>bad()</script>\n```js\ncode()\n```\n" + new string('x', 300));
        Assert.StartsWith("😀 Door Open the gate.", excerpt);
        Assert.DoesNotContain("https://", excerpt);
        Assert.DoesNotContain("<", excerpt);
        Assert.DoesNotContain("code()", excerpt);
        Assert.True(excerpt.Length <= 240);
        Assert.Equal(new SearchHighlight(3, 7), Assert.Single(SearchText.Highlights(excerpt, "door")));
    }
}
