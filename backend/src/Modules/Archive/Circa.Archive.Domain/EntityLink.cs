namespace Circa.Archive.Domain;

/// <summary>A resolved or draft <c>[[TYPE-NUMBER]]</c> reference from a record or Incident.</summary>
public sealed class EntityLink
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Draft containing the unresolved link; null once moved to a record.</summary>
    public Guid? DraftId { get; set; }

    /// <summary>Record containing the link; null when the source is a draft or Incident.</summary>
    public Guid? SourceRecordId { get; set; }

    /// <summary>Incident containing the link; null when the source is a draft or record.</summary>
    public Guid? SourceIncidentId { get; set; }

    /// <summary>Kind of entity the link points at.</summary>
    public ArchiveEntityType TargetType { get; set; }

    /// <summary>Target entity key; resolution is validated at submission.</summary>
    public Guid TargetId { get; set; }

    /// <summary>Original link text, e.g. <c>INC-008928</c>.</summary>
    public string RawLink { get; set; } = string.Empty;

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Draft? Draft { get; set; }
    public Record? SourceRecord { get; set; }
    public Incident? SourceIncident { get; set; }
}
