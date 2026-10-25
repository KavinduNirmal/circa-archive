namespace Circa.Archive.Domain;

/// <summary>A record's position within a playlist.</summary>
public sealed class PlaylistItem
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Playlist containing the item.</summary>
    public Guid PlaylistId { get; set; }

    /// <summary>Record placed in the playlist.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Zero-based reading order.</summary>
    public int Position { get; set; }

    /// <summary>Time the item was added in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Playlist? Playlist { get; set; }
    public Record? Record { get; set; }
}
