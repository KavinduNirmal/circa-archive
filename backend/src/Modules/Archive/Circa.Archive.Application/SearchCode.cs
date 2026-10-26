using System.Globalization;
using System.Text.RegularExpressions;

namespace Circa.Archive.Application;

public sealed record SearchCode(string Canonical, bool Reserved)
{
    public static SearchCode? Parse(string value)
    {
        var code = value.Trim().ToUpperInvariant();
        if (Regex.IsMatch(code, @"\AORG-[A-Z]-[0-9]{1,18}\z", RegexOptions.CultureInvariant))
            return new(code, false);
        var match = Regex.Match(code, @"\A(INC|EXP|EVI|ORG|CHR|ITM)-([0-9]{1,19})\z", RegexOptions.CultureInvariant);
        if (!match.Success || !long.TryParse(match.Groups[2].Value, NumberStyles.None, CultureInfo.InvariantCulture, out var number)) return null;
        var prefix = match.Groups[1].Value;
        var reservedThrough = prefix switch { "INC" => 7539, "EXP" => 288901, "EVI" => 35782, "ORG" => 5428, "CHR" => 18256, _ => -1 };
        return new(Format(prefix, number), number <= reservedThrough);
    }

    public static string Format(string prefix, long number) => $"{prefix}-{number.ToString("D6", CultureInfo.InvariantCulture)}";
}
