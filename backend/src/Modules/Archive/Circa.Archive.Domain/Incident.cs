namespace Circa.Archive.Domain;

/// <summary>The originating ghost story; every filing is made against one Incident.</summary>
public sealed class Incident
{
    /// <summary>UUIDv7 primary key; never exposed as the display identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Display number for <c>INC-000000</c>; 0-7539 is reserved.</summary>
    public long ReferenceNumber { get; set; }

    /// <summary>Risk assessment from E (harmless under known conditions) to O (extinction threat).</summary>
    public IncidentSeverity Severity { get; set; }

    /// <summary>Archival title.</summary>
    public string Designation { get; set; } = string.Empty;

    /// <summary>Narrative body; the initial account of the Incident.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>Author who filed the Incident.</summary>
    public Guid AuthorId { get; set; }

    /// <summary>Organization the author filed under; null means CIRCA.</summary>
    public Guid? AuthorAffiliationOrgId { get; set; }

    /// <summary>Organization claiming the Incident as private property; null means CIRCA.</summary>
    public Guid? ClaimOrgId { get; set; }

    /// <summary>Read visibility, including sealed access requests and platform restriction.</summary>
    public AccessPolicy AccessPolicy { get; set; } = AccessPolicy.Public;

    /// <summary>Cosmetic clearance level 3-6 printed on the sheet; not an authorization control.</summary>
    public short? Classification { get; set; }

    /// <summary>Macro content-warning tier; null when no tier was chosen.</summary>
    public WarningTier? WarningTier { get; set; }

    /// <summary>Records whether warnings were omitted, confirmed inapplicable, or undecided.</summary>
    public WarningDisclosure WarningDisclosure { get; set; } = WarningDisclosure.NotProvided;

    /// <summary>Specific AO3-style warning labels accompanying the tier.</summary>
    public List<string> WarningTags { get; set; } = [];

    /// <summary>Organization-specific alias code; cosmetic only, the archive reference stays canonical.</summary>
    public string? HolderCode { get; set; }

    /// <summary>Lifecycle state; erased Incidents keep their number but stop rendering.</summary>
    public RecordStatus RecordStatus { get; set; } = RecordStatus.OnFile;

    /// <summary>SHA-256 of the Markdown, used for duplicate and tamper detection.</summary>
    public string ContentHash { get; set; } = string.Empty;

    /// <summary>Filing time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last substantive edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public Organization? AuthorAffiliationOrganization { get; set; }
    public Organization? ClaimOrganization { get; set; }
    public ICollection<IncidentDesignation> Designations { get; set; } = [];
    public ICollection<IncidentRevision> Revisions { get; set; } = [];
    public ICollection<Record> Records { get; set; } = [];
    public ICollection<Playlist> Playlists { get; set; } = [];
    public ICollection<Draft> Drafts { get; set; } = [];
    public ICollection<Recovery> OriginRecoveries { get; set; } = [];
    public ICollection<OrgMention> Mentions { get; set; } = [];
    public ICollection<EntityLink> EntityLinks { get; set; } = [];
}
