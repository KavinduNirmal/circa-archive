namespace Circa.Archive.Domain;

/// <summary>Recorded mention of an organization in a record or Incident.</summary>
public sealed class OrgMention
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Mentioned organization; null when only raw text survives.</summary>
    public Guid? OrgId { get; set; }

    /// <summary>Record containing the mention; null when the source is an Incident.</summary>
    public Guid? RecordId { get; set; }

    /// <summary>Incident containing the mention; null when the source is a record.</summary>
    public Guid? IncidentId { get; set; }

    /// <summary>Link text exactly as authored.</summary>
    public string RawText { get; set; } = string.Empty;

    /// <summary>Extraction time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Organization? Organization { get; set; }
    public Record? Record { get; set; }
    public Incident? Incident { get; set; }
}
