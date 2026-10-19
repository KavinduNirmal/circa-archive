using Microsoft.AspNetCore.Identity;

namespace Circa.Auth.Domain;

public sealed class AppUser : IdentityUser<Guid>
{
    public string Role { get; private set; } = "author";
    public DateTimeOffset CreatedAt { get; private set; }
    public int StrikeCount { get; private set; }
    public DateTimeOffset? LastStrikeAt { get; private set; }
    public DateTimeOffset? RestrictedUntil { get; private set; }

    public AppUser()
    {
    }

    public static AppUser Create(string username, string email, string role = "author", DateTimeOffset? now = null)
    {
        var createdAt = now ?? DateTimeOffset.UtcNow;
        return new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = username,
            Email = email,
            Role = role,
            CreatedAt = createdAt,
            SecurityStamp = Guid.NewGuid().ToString()
        };
    }

    public bool CanPost(DateTimeOffset now) => RestrictedUntil is null || RestrictedUntil <= now;

    public void ApplyStrike(DateTimeOffset now, TimeSpan? restrictionDuration = null)
    {
        StrikeCount++;
        LastStrikeAt = now;
        if (restrictionDuration.HasValue)
        {
            RestrictedUntil = now.Add(restrictionDuration.Value);
        }
    }

    public void SetRole(string role)
    {
        Role = role;
    }
}
