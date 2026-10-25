namespace Circa.Archive.Domain;

/// <summary>An organization's local designation for an Incident, e.g. <c>Qterw-3-7</c>.</summary>
public sealed class IncidentDesignation
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Incident carrying this alternate designation.</summary>
    public Guid IncidentId { get; set; }

    /// <summary>Organization that uses the designation.</summary>
    public Guid OrgId { get; set; }

    /// <summary>Organization-local label.</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Creation time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Incident? Incident { get; set; }
    public Organization? Organization { get; set; }
}
