namespace Circa.Archive.Domain;

/// <summary>An author's challenge to a moderation action.</summary>
public sealed class ModerationAppeal
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Moderation action being appealed.</summary>
    public Guid ModerationLogId { get; set; }

    /// <summary>Author submitting the appeal.</summary>
    public Guid AppellantId { get; set; }

    /// <summary>Appellant's statement.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Decision state; pending until an authorized user rules.</summary>
    public ModerationAppealStatus Status { get; set; } = ModerationAppealStatus.Pending;

    /// <summary>User who decided the appeal; null while pending.</summary>
    public Guid? DecidedBy { get; set; }

    /// <summary>Decision time in UTC; null while pending.</summary>
    public DateTimeOffset? DecidedAt { get; set; }

    /// <summary>Appeal time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public ModerationLog? ModerationLog { get; set; }
}
