namespace Circa.Archive.Domain;

/// <summary>Audit entry for a meta moderation action; author identity is anonymized here.</summary>
public sealed class ModerationLog
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Action taken.</summary>
    public ModerationActionType Action { get; set; }

    /// <summary>Rule category that justified the action.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Anonymized author reference; never the public author identity.</summary>
    public Guid AnonymizedAuthorId { get; set; }

    /// <summary>Affected record; null for account-level actions.</summary>
    public Guid? RecordId { get; set; }

    /// <summary>Stated reason, shared with the author and in the log.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Moderator who acted.</summary>
    public Guid ModeratorId { get; set; }

    /// <summary>Action time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Record? Record { get; set; }
    public ICollection<ModerationAppeal> Appeals { get; set; } = [];
}
