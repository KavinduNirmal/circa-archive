namespace Circa.Archive.Domain;

/// <summary>Preserved snapshot of an Incident edit; the public revision history.</summary>
public sealed class IncidentRevision
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Incident this revision belongs to.</summary>
    public Guid IncidentId { get; set; }

    /// <summary>Markdown as it stood after the edit.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>User who made the edit.</summary>
    public Guid EditorId { get; set; }

    /// <summary>Optional stated reason, shown in the revision log.</summary>
    public string? Reason { get; set; }

    /// <summary>Edit time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Incident? Incident { get; set; }
}
