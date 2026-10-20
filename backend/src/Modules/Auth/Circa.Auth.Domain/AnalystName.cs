using System.Security.Cryptography;

namespace Circa.Auth.Domain;

public static class AnalystName
{
    private static readonly string[] MiddleNames = ["John", "Alex", "Robin", "Morgan", "Sam", "Elliot", "Jamie", "Taylor"];
    private static readonly string[] LastNames = ["Doe", "Reed", "Stone", "Ward", "Hayes", "Shaw", "Finch", "Grey"];

    public static string Generate() =>
        $"{(char)('A' + RandomNumberGenerator.GetInt32(26))}. {MiddleNames[RandomNumberGenerator.GetInt32(MiddleNames.Length)]} {LastNames[RandomNumberGenerator.GetInt32(LastNames.Length)]}";

    public static bool IsValid(string name)
    {
        var parts = name.Split(' ');
        return parts.Length == 3 && parts[0].Length == 2 && parts[0][0] is >= 'A' and <= 'Z' &&
            parts[0][1] == '.' && MiddleNames.Contains(parts[1]) && LastNames.Contains(parts[2]);
    }
}
