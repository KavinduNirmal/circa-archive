namespace Circa.Archive.Domain;

/// <summary>An in-world body that researches, explores, manages, or claims Incidents.</summary>
public sealed class Organization
{
    /// <summary>UUIDv7 primary key; never exposed as the display identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Display number for <c>ORG-000000</c>; 0-5428 is reserved.</summary>
    public long ReferenceNumber { get; set; }

    /// <summary>Public organization name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Proposed founding year; null when unstated.</summary>
    public int? EstablishedYear { get; set; }

    /// <summary>Year the author proposes the organization contacted CIRCA; null until recognized.</summary>
    public int? RecognizedYear { get; set; }

    /// <summary>Directory standing decided by community vote, not platform authority.</summary>
    public RecognitionState RecognitionState { get; set; } = RecognitionState.Unrecognized;

    /// <summary>User who filed the organization.</summary>
    public Guid FiledById { get; set; }

    /// <summary>Filing time in UTC.</summary>
    public DateTimeOffset FiledAt { get; set; }

    /// <summary>Last dossier edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>Usual jurisdiction or operating region.</summary>
    public string? GeographicInfluence { get; set; }

    /// <summary>Reported headcount; informational, not a hard roster.</summary>
    public int? PersonnelCount { get; set; }

    /// <summary>Object-storage key for the 1:1 logo.</summary>
    public string? LogoObjectKey { get; set; }

    /// <summary>JSON array of gallery object-storage keys.</summary>
    public string Gallery { get; set; } = "[]";

    /// <summary>Government, private, or religious body.</summary>
    public OrganizationType? OrganizationType { get; set; }

    /// <summary>Dossier body, capped at 10,000 words.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>JSON array of custom severity words, each at most 10 characters.</summary>
    public string SeverityWords { get; set; } = "[]";

    /// <summary>Replaces <c>my.circa.archive</c> in adopters' display email.</summary>
    public string? EmailLocalPart { get; set; }

    /// <summary>JSON holder-code layout: prefix, number, suffix, severity, arrangement.</summary>
    public string? HolderCodeFormat { get; set; }

    /// <summary>Registry lifecycle; erased organizations keep their code but leave the directory.</summary>
    public RecordStatus RecordStatus { get; set; } = RecordStatus.OnFile;

    /// <summary>Cached recognition vote balance kept for directory ordering.</summary>
    public int VoteScore { get; set; }

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<Incident> AuthoredIncidents { get; set; } = [];
    public ICollection<Incident> ClaimedIncidents { get; set; } = [];
    public ICollection<IncidentDesignation> Designations { get; set; } = [];
    public ICollection<Record> AuthoredRecords { get; set; } = [];
    public ICollection<OrganizationModerator> Moderators { get; set; } = [];
    public ICollection<OrganizationRevision> Revisions { get; set; } = [];
    public ICollection<OrganizationVote> Votes { get; set; } = [];
    public ICollection<Recognition> RecognitionsGiven { get; set; } = [];
    public ICollection<Recognition> RecognitionsReceived { get; set; } = [];
    public ICollection<OrgMention> Mentions { get; set; } = [];
    public ICollection<Recovery> FirstRecovered { get; set; } = [];
    public ICollection<Recovery> Custodied { get; set; } = [];
}
