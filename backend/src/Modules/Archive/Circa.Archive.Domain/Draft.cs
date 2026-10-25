namespace Circa.Archive.Domain;

/// <summary>Editable pre-submission filing; never public.</summary>
public sealed class Draft
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Author editing the draft.</summary>
    public Guid AuthorId { get; set; }

    /// <summary>Intended filing kind, including the originating Incident itself.</summary>
    public DraftRecordType RecordType { get; set; }

    /// <summary>Incident the draft will be filed against; null while creating one.</summary>
    public Guid? IncidentId { get; set; }

    /// <summary>Working Markdown, including unresolved temporary links.</summary>
    public string Markdown { get; set; } = string.Empty;

    /// <summary>Planned read visibility for the submitted record.</summary>
    public AccessPolicy AccessPolicy { get; set; } = AccessPolicy.Public;

    /// <summary>Planned macro content-warning tier.</summary>
    public WarningTier? WarningTier { get; set; }

    /// <summary>Planned warning disclosure state.</summary>
    public WarningDisclosure WarningDisclosure { get; set; } = WarningDisclosure.NotProvided;

    /// <summary>Planned warning labels.</summary>
    public List<string> WarningTags { get; set; } = [];

    /// <summary>Editing state; only Submitted drafts have promoted entities.</summary>
    public DraftStatus Status { get; set; } = DraftStatus.Editing;

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last autosave time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public Incident? Incident { get; set; }
    public ICollection<TemporaryEntity> TemporaryEntities { get; set; } = [];
    public ICollection<CharacterImport> CharacterImports { get; set; } = [];
    public ICollection<EntityLink> EntityLinks { get; set; } = [];
}
