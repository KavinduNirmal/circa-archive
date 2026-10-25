namespace Circa.Archive.Domain;

/// <summary>A reader's request to view the body of a sealed record.</summary>
public sealed class RecordAccessRequest
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Sealed record being requested.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Account making the request.</summary>
    public Guid RequesterId { get; set; }

    /// <summary>Decision state; pending requests do not reveal the body.</summary>
    public AccessRequestStatus Status { get; set; } = AccessRequestStatus.Pending;

    /// <summary>Authorized user who decided the request; null while pending.</summary>
    public Guid? DecidedBy { get; set; }

    /// <summary>Decision time in UTC; null while pending.</summary>
    public DateTimeOffset? DecidedAt { get; set; }

    /// <summary>Request time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Record? Record { get; set; }
}
