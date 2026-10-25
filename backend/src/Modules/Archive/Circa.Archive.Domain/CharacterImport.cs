namespace Circa.Archive.Domain;

/// <summary>Per-draft permission record for using another author's character.</summary>
public sealed class CharacterImport
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Draft that imported the character.</summary>
    public Guid DraftId { get; set; }

    /// <summary>Character being imported.</summary>
    public Guid CharacterId { get; set; }

    /// <summary>Author who made the import.</summary>
    public Guid ImportedById { get; set; }

    /// <summary>When the importer acknowledged a Restricted warning; null when Open.</summary>
    public DateTimeOffset? RestrictedAcknowledgedAt { get; set; }

    /// <summary>When the character owner was notified of the pending submission.</summary>
    public DateTimeOffset? OwnerNotifiedAt { get; set; }

    /// <summary>Import time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Draft? Draft { get; set; }
    public Character? Character { get; set; }
}
