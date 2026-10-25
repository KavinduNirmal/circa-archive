namespace Circa.Archive.Domain;

/// <summary>An EXP, EVI, or RUM filing made against an Incident.</summary>
public sealed class Record
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Filing kind, which determines the display prefix.</summary>
    public RecordType RecordType { get; set; }

    /// <summary>Sequence number per record type; Rumours consume one even without a code.</summary>
    public long ReferenceNumber { get; set; }

    /// <summary>Display code for EXP/EVI; null for Rumours.</summary>
    public string? Code { get; set; }

    /// <summary>Incident this record is filed against.</summary>
    public Guid IncidentId { get; set; }

    /// <summary>Author who filed the record.</summary>
    public Guid AuthorId { get; set; }

    /// <summary>Organization the author filed under; null means CIRCA.</summary>
    public Guid? AuthorAffiliationOrgId { get; set; }

    /// <summary>Narrative body.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>Earlier record this one narratively continues; null when not a continuation.</summary>
    public Guid? FollowsRecordId { get; set; }

    /// <summary>Read visibility.</summary>
    public AccessPolicy AccessPolicy { get; set; } = AccessPolicy.Public;

    /// <summary>Cosmetic clearance level 3-6; null for Rumours.</summary>
    public short? Classification { get; set; }

    /// <summary>Macro content-warning tier.</summary>
    public WarningTier? WarningTier { get; set; }

    /// <summary>Whether warnings were omitted, confirmed inapplicable, or undecided.</summary>
    public WarningDisclosure WarningDisclosure { get; set; } = WarningDisclosure.NotProvided;

    /// <summary>Specific AO3-style warning labels.</summary>
    public List<string> WarningTags { get; set; } = [];

    /// <summary>Organization-specific alias code; cosmetic only.</summary>
    public string? HolderCode { get; set; }

    /// <summary>Lifecycle state; erased or tombstoned records keep their code occupied.</summary>
    public RecordStatus RecordStatus { get; set; } = RecordStatus.OnFile;

    /// <summary>SHA-256 of the Markdown, used for duplicate and repost detection.</summary>
    public string ContentHash { get; set; } = string.Empty;

    /// <summary>Filing time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last substantive edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public Incident? Incident { get; set; }
    public Organization? AuthorAffiliationOrganization { get; set; }
    public Record? FollowsRecord { get; set; }
    public ICollection<Record> FollowedByRecords { get; set; } = [];
    public ICollection<RecordTag> Tags { get; set; } = [];
    public ICollection<RecordRevision> Revisions { get; set; } = [];
    public ICollection<RecordAssessment> Assessments { get; set; } = [];
    public ICollection<RecordAccessRequest> AccessRequests { get; set; } = [];
    public ICollection<PlaylistItem> PlaylistItems { get; set; } = [];
    public ICollection<Recovery> FirstDocumentedRecoveries { get; set; } = [];
    public ICollection<Recognition> Recognitions { get; set; } = [];
    public ICollection<OrgMention> Mentions { get; set; } = [];
    public ICollection<ModerationLog> ModerationLogs { get; set; } = [];
    public ICollection<Tombstone> Tombstones { get; set; } = [];
    public ICollection<EntityLink> EntityLinks { get; set; } = [];
}
