namespace Circa.Archive.Domain;

/// <summary>A record-backed claim that one organization recognizes another.</summary>
public sealed class Recognition
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Organization making the recognition claim.</summary>
    public Guid RecognizingOrgId { get; set; }

    /// <summary>Organization claimed to be recognized.</summary>
    public Guid RecognizedOrgId { get; set; }

    /// <summary>Record supplying the evidence for the claim.</summary>
    public Guid RecordId { get; set; }

    /// <summary>Whether the claim has been approved by the community process.</summary>
    public bool Approved { get; set; }

    /// <summary>Claim time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Organization? RecognizingOrganization { get; set; }
    public Organization? RecognizedOrganization { get; set; }
    public Record? Record { get; set; }
}
