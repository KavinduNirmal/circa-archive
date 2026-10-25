namespace Circa.Archive.Domain;

/// <summary>Filter tag attached to a record.</summary>
public sealed class RecordTag
{
    /// <summary>Owning record.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Normalized tag text, unique per record.</summary>
    public string Tag { get; set; } = string.Empty;

    public Record? Record { get; set; }
}
