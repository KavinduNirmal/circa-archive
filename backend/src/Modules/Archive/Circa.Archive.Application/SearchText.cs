using System.Net;
using System.Text.RegularExpressions;

namespace Circa.Archive.Application;

public static class SearchText
{
    public static string Excerpt(string markdown)
    {
        // This is a plain-text preview, not a Markdown renderer or an HTML sanitizer.
        var text = Regex.Replace(markdown, @"```[\s\S]*?```|~~~[\s\S]*?~~~|<(script|style)\b[^>]*>[\s\S]*?</\1>", " ", RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(100));
        text = Regex.Replace(text, @"!?\[([^\]]*)\]\([^)]*\)", "$1");
        text = WebUtility.HtmlDecode(Regex.Replace(text, "<[^>]*>", " "));
        text = Regex.Replace(text, @"(?m)^\s{0,3}[#>]+\s*|[*_`~]|[<>]", "");
        text = Regex.Replace(text, @"\s+", " ").Trim();
        if (text.Length <= 240) return text;
        var end = char.IsHighSurrogate(text[238]) ? 238 : 239;
        return text[..end].TrimEnd() + "…";
    }

    public static SearchHighlight[] Highlights(string excerpt, string query)
    {
        if (query.Length == 0) return [];
        var ranges = new List<SearchHighlight>();
        for (var start = 0; start <= excerpt.Length - query.Length;)
        {
            var found = excerpt.IndexOf(query, start, StringComparison.OrdinalIgnoreCase);
            if (found < 0) break;
            ranges.Add(new(found, found + query.Length));
            start = found + query.Length;
        }
        return ranges.ToArray();
    }
}
