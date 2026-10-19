namespace Circa.Auth.Infrastructure.Options;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenLifetimeSeconds { get; set; } = 600;
    public int SessionLifetimeDays { get; set; } = 7;
    public int RefreshGraceSeconds { get; set; } = 30;
    public int RefreshThresholdSeconds { get; set; } = 120;
    public string CookieDomain { get; set; } = string.Empty;
    public bool RequireSecureCookies { get; set; } = true;
    public int LoginRateLimitPermitLimit { get; set; } = 5;
    public int RegisterRateLimitPermitLimit { get; set; } = 3;
    public int RefreshRateLimitPermitLimit { get; set; } = 30;

    public TimeSpan SessionLifetime => TimeSpan.FromDays(SessionLifetimeDays);
    public TimeSpan RefreshGrace => TimeSpan.FromSeconds(RefreshGraceSeconds);
    public TimeSpan AccessTokenLifetime => TimeSpan.FromSeconds(AccessTokenLifetimeSeconds);
}
