namespace Circa.Archive.Domain;

/// <summary>Moderation removal marker for a record; distinct from author erasure.</summary>
public sealed class Tombstone
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Record removed from discoverability.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Reason shown to the author and recorded in the public log.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Rule category such as harassment, spam, or plagiarism.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Content hash at removal time, used to detect reposting.</summary>
    public string Hash { get; set; } = string.Empty;

    /// <summary>Moderator who applied the tombstone.</summary>
    public Guid TombstonedBy { get; set; }

    /// <summary>Removal time in UTC.</summary>
    public DateTimeOffset TombstonedAt { get; set; }

    public Record? Record { get; set; }
}
