namespace Circa.Archive.Domain;

/// <summary>Kind of filing; the display prefix follows from this value.</summary>
public enum RecordType
{
    Exploration,
    Evidence,
    Rumour
}

/// <summary>Filing kind selectable in a draft, including the originating Incident.</summary>
public enum DraftRecordType
{
    Incident,
    Exploration,
    Evidence,
    Rumour
}

/// <summary>Lifecycle of a permanent record. Codes stay occupied after erasure.</summary>
public enum RecordStatus
{
    OnFile,
    Erased,
    Tombstoned
}

/// <summary>Who may read the rendered record.</summary>
public enum AccessPolicy
{
    Public,
    Sealed,
    Restricted
}

/// <summary>Macro content-warning severity shown on the sheet.</summary>
public enum WarningTier
{
    Red,
    Yellow,
    Green
}

/// <summary>Distinguishes "no warnings" from "none apply" and "undecided".</summary>
public enum WarningDisclosure
{
    None,
    NoWarningsApply,
    NotProvided
}

/// <summary>Incident risk scale; U means insufficient or contradictory information.</summary>
public enum IncidentSeverity
{
    E,
    D,
    C,
    B,
    A,
    S,
    O,
    U
}

/// <summary>Community directory standing; recognition is not endorsement or truth.</summary>
public enum RecognitionState
{
    Recognized,
    Unrecognized
}

/// <summary>In-world nature of an organization.</summary>
public enum OrganizationType
{
    Government,
    Private,
    Religious
}

/// <summary>Whether other authors may adopt and reshape a character.</summary>
public enum CharacterUsage
{
    Restricted,
    Open
}

/// <summary>Physical or documentary class of a recovery.</summary>
public enum RecoveryCategory
{
    Object,
    Document,
    Substance,
    Organism,
    Material,
    Other,
    Undetermined
}

/// <summary>Completeness of a recovery's registry page.</summary>
public enum DocumentationStatus
{
    Basic,
    Documented
}

/// <summary>Whether a recovery is still part of the active registry.</summary>
public enum RegistryStatus
{
    Active,
    Erased
}

/// <summary>Reported possession state of a recovery.</summary>
public enum CustodyStatus
{
    Unknown,
    Unclaimed,
    Claimed,
    Disputed,
    Lost,
    Destroyed
}

/// <summary>Whether a recovery can be produced again.</summary>
public enum Reproducibility
{
    Unknown,
    Unique,
    Repeatable
}

/// <summary>Reviewer's advisory stance; never establishes factual truth.</summary>
public enum AssessmentValue
{
    Corroborate,
    Contest
}

/// <summary>Decision state of a request to read a sealed record.</summary>
public enum AccessRequestStatus
{
    Pending,
    Approved,
    Denied,
    Expired
}

/// <summary>Editing lifecycle of a draft before atomic submission.</summary>
public enum DraftStatus
{
    Editing,
    Submitted,
    Discarded
}

/// <summary>Entity kinds that a draft link or temporary entity may target.</summary>
public enum ArchiveEntityType
{
    Incident,
    Exploration,
    Evidence,
    Rumour,
    Organization,
    Character,
    Recovery
}

/// <summary>Meta action taken against content or an account.</summary>
public enum ModerationActionType
{
    Tombstone,
    Warning,
    Restriction,
    Suspension,
    Removal
}

/// <summary>Outcome of an appeal against a moderation action.</summary>
public enum ModerationAppealStatus
{
    Pending,
    Upheld,
    Overturned
}

/// <summary>In-world mail category used for routing and presentation.</summary>
public enum EmailType
{
    System,
    Popular,
    Recent,
    Case,
    Digest,
    DeadLetter
}

/// <summary>What a folder groups in the desktop file system.</summary>
public enum FolderType
{
    Incident,
    Record,
    Organization,
    Archive,
    User
}
