using System.Collections.Frozen;
using System.Text.Json;

namespace Circa.Auth.Application.Blocklists;

internal static class UsernameBlocklist
{
    private static readonly FrozenSet<string> ReservedNames = LoadReservedNames();

    public static bool IsReserved(string username) => ReservedNames.Contains(username);

    private static FrozenSet<string> LoadReservedNames()
    {
        // Embed the reviewed snapshot so registration never depends on upstream network availability.
        using var stream = typeof(UsernameBlocklist).Assembly.GetManifestResourceStream(
            "Circa.Auth.Application.Blocklists.reserved-usernames.json")
            ?? throw new InvalidOperationException("The reserved username blocklist is missing.");
        var names = JsonSerializer.Deserialize<string[]>(stream)
            ?? throw new InvalidOperationException("The reserved username blocklist is invalid.");
        return names.ToFrozenSet(StringComparer.OrdinalIgnoreCase);
    }
}
