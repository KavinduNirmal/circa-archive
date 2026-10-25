namespace Circa.Archive.Domain;

/// <summary>Desktop folder that groups emails or archive references.</summary>
public sealed class Folder
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Folder name shown in the desktop tree.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Parent folder; null for a root folder.</summary>
    public Guid? ParentId { get; set; }

    /// <summary>Owning account; null for shared or system folders.</summary>
    public Guid? OwnerId { get; set; }

    /// <summary>What the folder represents.</summary>
    public FolderType Type { get; set; }

    /// <summary>Optional entity key the folder is bound to (Incident, record, org, archive).</summary>
    public Guid? RefId { get; set; }

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Folder? Parent { get; set; }
    public ICollection<Folder> Children { get; set; } = [];
    public ICollection<Email> Emails { get; set; } = [];
}
