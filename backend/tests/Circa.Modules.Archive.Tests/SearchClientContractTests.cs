using System.Text.RegularExpressions;
using Circa.Archive.Application;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchClientContractTests
{
    [Fact]
    public void AcceptsEveryValueTheClientContractCanEmit()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "client/src/lib/search/contract.ts"))) root = root.Parent;
        Assert.NotNull(root);
        var source = File.ReadAllText(Path.Combine(root.FullName, "client/src/lib/search/contract.ts"));
        var keys = new Dictionary<string, string>
        {
            ["SEARCH_TYPES"] = "type", ["RECORD_CLASSES"] = "class", ["DISPLAY_STATUSES"] = "status",
            ["WARNING_TIERS"] = "warn", ["WARNING_DISCLOSURES"] = "disclosure", ["WARNING_TAGS"] = "warnTag",
            ["SEARCH_PERIODS"] = "period", ["SEARCH_SORTS"] = "sort", ["SEARCH_LANGUAGES"] = "language"
        };
        foreach (var (constant, key) in keys)
        {
            var list = Regex.Match(source, $@"export const {constant} = \[([^\]]+)\]", RegexOptions.Singleline);
            Assert.True(list.Success, constant);
            foreach (Match value in Regex.Matches(list.Groups[1].Value, "\"([^\"]+)\""))
            {
                var result = SearchRequestValidator.Parse(new Dictionary<string, string[]> { [key] = [value.Groups[1].Value] });
                Assert.Empty(result.Errors);
                Assert.NotNull(result.Request);
            }
        }
    }
}
