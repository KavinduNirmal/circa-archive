namespace Circa.Archive.Domain;

/// <summary>Draft-scoped placeholder promoted to a permanent entity on submission.</summary>
public sealed class TemporaryEntity
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Draft that owns the placeholder.</summary>
    public Guid DraftId { get; set; }

    /// <summary>Draft-scoped token such as <c>TEMP-EVI-01</c>.</summary>
    public string TempCode { get; set; } = string.Empty;

    /// <summary>Kind of permanent entity this will become.</summary>
    public ArchiveEntityType EntityType { get; set; }

    /// <summary>Barebones name; other fields wait for promotion.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>JSON payload of any fields supplied before promotion.</summary>
    public string Payload { get; set; } = "{}";

    /// <summary>Object-storage key for a temporary image, if any.</summary>
    public string? ImageObjectKey { get; set; }

    /// <summary>Permanent entity created on submission; null until promoted.</summary>
    public Guid? PromotedEntityId { get; set; }

    /// <summary>Promotion time in UTC; null until submission succeeds.</summary>
    public DateTimeOffset? PromotedAt { get; set; }

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Draft? Draft { get; set; }
}
