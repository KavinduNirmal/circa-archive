namespace Circa.Auth.Domain;

public sealed class Session
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public byte[] RefreshTokenHash { get; private set; } = [];
    public byte[]? PreviousTokenHash { get; private set; }
    public DateTimeOffset? PreviousGraceUntil { get; private set; }
    public byte[]? ReplacementTokenCiphertext { get; private set; }
    public int TokenVersion { get; private set; } = 1;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset LastUsedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? RevokedReason { get; private set; }
    public string? CreatedIp { get; private set; }
    public string? UserAgent { get; private set; }

    public Session()
    {
    }

    public static Session Create(
        Guid userId,
        byte[] refreshTokenHash,
        DateTimeOffset now,
        TimeSpan sessionLifetime,
        string? ipAddress = null,
        string? userAgent = null)
    {
        return new Session
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RefreshTokenHash = refreshTokenHash,
            TokenVersion = 1,
            CreatedAt = now,
            LastUsedAt = now,
            ExpiresAt = now.Add(sessionLifetime),
            CreatedIp = ipAddress,
            UserAgent = userAgent
        };
    }

    public bool IsLive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;

    public void Rotate(
        byte[] newHash,
        byte[] replacementCiphertext,
        DateTimeOffset now,
        TimeSpan gracePeriod)
    {
        PreviousTokenHash = RefreshTokenHash;
        PreviousGraceUntil = now.Add(gracePeriod);
        ReplacementTokenCiphertext = replacementCiphertext;
        RefreshTokenHash = newHash;
        LastUsedAt = now;
    }

    public void Revoke(DateTimeOffset now, string reason)
    {
        RevokedAt = now;
        RevokedReason = reason;
        TokenVersion++;
    }
}
