namespace Circa.Archive.Domain;

/// <summary>One reader's advisory assessment of a record; at most one per account.</summary>
public sealed class RecordAssessment
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Record being assessed.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Assessing account.</summary>
    public Guid UserId { get; set; }

    /// <summary>Corroborate or Contest; never establishes factual status.</summary>
    public AssessmentValue Assessment { get; set; }

    /// <summary>Assessment time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Record? Record { get; set; }
}
