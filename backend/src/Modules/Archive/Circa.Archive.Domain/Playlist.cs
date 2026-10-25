namespace Circa.Archive.Domain;

/// <summary>An author's private reading order for an Incident; never canon.</summary>
public sealed class Playlist
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Incident whose filings the playlist orders.</summary>
    public Guid IncidentId { get; set; }

    /// <summary>Author who owns the playlist.</summary>
    public Guid AuthorId { get; set; }

    /// <summary>Playlist title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Optional explanation of the reading order.</summary>
    public string? Description { get; set; }

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last edit time in UTC.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public Incident? Incident { get; set; }
    public ICollection<PlaylistItem> Items { get; set; } = [];
}
