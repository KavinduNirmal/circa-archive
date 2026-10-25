using Microsoft.EntityFrameworkCore;

namespace Circa.Archive.Infrastructure.Persistence;

public static class ArchiveSchemaInitializer
{
    private const string ResourceName =
        "Circa.Archive.Infrastructure.Persistence.CreateArchiveSchema.sql";

    public static async Task EnsureAsync(ArchiveDbContext database, CancellationToken cancellationToken = default)
    {
        var assembly = typeof(ArchiveSchemaInitializer).Assembly;
        await using var stream = assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Embedded schema resource '{ResourceName}' was not found.");
        using var reader = new StreamReader(stream);
        var script = await reader.ReadToEndAsync(cancellationToken);

        await database.Database.ExecuteSqlRawAsync(script, cancellationToken);
    }
}
