namespace Circa.Archive.Domain;

/// <summary>Preserved snapshot of an organization dossier edit.</summary>
public sealed class OrganizationRevision
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Organization this revision belongs to.</summary>
    public Guid OrgId { get; set; }

    /// <summary>Dossier Markdown as it stood after the edit.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>User who made the edit.</summary>
    public Guid EditorId { get; set; }

    /// <summary>Optional stated reason, shown in the revision log.</summary>
    public string? Reason { get; set; }

    /// <summary>Edit time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Organization? Organization { get; set; }
}
