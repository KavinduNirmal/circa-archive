namespace Circa.Archive.Domain;

/// <summary>A reusable in-world person whose owner controls how others may portray them.</summary>
public sealed class Character
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Display number for <c>CHR-000000</c>; 0-18256 is reserved.</summary>
    public long ReferenceNumber { get; set; }

    /// <summary>Character name, at most 120 characters.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>JSON array of author-defined metadata sections and key/value rows.</summary>
    public string Metadata { get; set; } = "[]";

    /// <summary>Dossier body, capped at 10,000 words.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>Author who created the character.</summary>
    public Guid CreatedById { get; set; }

    /// <summary>Restricted by default; Open permits other authors to adopt and reshape the character.</summary>
    public CharacterUsage UsagePolicy { get; set; } = CharacterUsage.Restricted;

    /// <summary>Lifecycle state; erased characters keep their reference number.</summary>
    public RecordStatus RecordStatus { get; set; } = RecordStatus.OnFile;

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last dossier edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<CharacterImport> Imports { get; set; } = [];
    public ICollection<Recovery> FirstRecovered { get; set; } = [];
    public ICollection<Recovery> Custodied { get; set; } = [];
}
