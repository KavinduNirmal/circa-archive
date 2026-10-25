namespace Circa.Archive.Domain;

/// <summary>Author appointed to maintain an organization dossier; no platform powers.</summary>
public sealed class OrganizationModerator
{
    /// <summary>Organization being maintained.</summary>
    public Guid OrgId { get; set; }

    /// <summary>Appointed author.</summary>
    public Guid UserId { get; set; }

    /// <summary>User who made the appointment.</summary>
    public Guid AppointedById { get; set; }

    /// <summary>Appointment time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Organization? Organization { get; set; }
}
