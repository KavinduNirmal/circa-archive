namespace Circa.Archive.Domain;

/// <summary>One account's advisory vote on an organization's recognition; one per user.</summary>
public sealed class OrganizationVote
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Organization being voted on.</summary>
    public Guid OrgId { get; set; }

    /// <summary>Voting account.</summary>
    public Guid UserId { get; set; }

    /// <summary>+1 for recognition, -1 against; advisory only.</summary>
    public int Value { get; set; }

    /// <summary>Vote time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Organization? Organization { get; set; }
}
