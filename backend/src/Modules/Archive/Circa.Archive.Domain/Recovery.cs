namespace Circa.Archive.Domain;

/// <summary>An in-world item, document, or entity held in the recovery registry.</summary>
public sealed class Recovery
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Display number for <c>ITM-000000</c>.</summary>
    public long ReferenceNumber { get; set; }

    /// <summary>Commonly used designation.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Other known names or designations.</summary>
    public List<string> AlternativeNames { get; set; } = [];

    /// <summary>Physical or documentary class.</summary>
    public RecoveryCategory Category { get; set; }

    /// <summary>Registry description, capped at 5,000 words.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Incident associated with its discovery; null when unknown.</summary>
    public Guid? OriginIncidentId { get; set; }

    /// <summary>Record that first documented the recovery; null when unrecorded.</summary>
    public Guid? FirstDocumentedRecordId { get; set; }

    /// <summary>Author who registered the recovery.</summary>
    public Guid RegisteredById { get; set; }

    /// <summary>Whether the registry page is a stub or complete.</summary>
    public DocumentationStatus DocumentationStatus { get; set; } = DocumentationStatus.Basic;

    /// <summary>Whether the recovery remains retrievable in the registry.</summary>
    public RegistryStatus RegistryStatus { get; set; } = RegistryStatus.Active;

    /// <summary>JSON array of author-defined metadata sections and key/value rows.</summary>
    public string Metadata { get; set; } = "[]";

    /// <summary>JSON array of gallery object-storage keys.</summary>
    public string Gallery { get; set; } = "[]";

    /// <summary>Character credited with the first recovery; nullable because it may be unknown.</summary>
    public Guid? FirstRecoveredByCharacterId { get; set; }

    /// <summary>Organization credited with the first recovery; nullable because it may be unknown.</summary>
    public Guid? FirstRecoveredByOrgId { get; set; }

    /// <summary>Character reported to possess it now; nullable because custody may be disputed or unknown.</summary>
    public Guid? CurrentCustodianCharacterId { get; set; }

    /// <summary>Organization reported to possess it now; nullable because custody may be disputed or unknown.</summary>
    public Guid? CurrentCustodianOrgId { get; set; }

    /// <summary>Reported possession state; a dispute does not establish ownership.</summary>
    public CustodyStatus CustodyStatus { get; set; } = CustodyStatus.Unknown;

    /// <summary>Whether another copy can be produced.</summary>
    public Reproducibility Reproducibility { get; set; } = Reproducibility.Unknown;

    /// <summary>Registration time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last registry edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public Incident? OriginIncident { get; set; }
    public Record? FirstDocumentedRecord { get; set; }
    public Organization? FirstRecoveredByOrganization { get; set; }
    public Organization? CurrentCustodianOrganization { get; set; }
    public Character? FirstRecoveredByCharacter { get; set; }
    public Character? CurrentCustodianCharacter { get; set; }
}
