using System.Net;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;

namespace Circa.Auth.Domain;

public sealed class AppUser : IdentityUser<Guid>
{
    // Id (UserId) = UUIDv7 for new accounts; inherited from IdentityUser<Guid>.
    // DisplayId = unique 9 character numeric string
    // DisplayName = A random English initial and two names from predefined lists. The result should not be unique, and the user should be able to reroll this at user creation. The DisplayName should be [English Letter] [Middle Name] [Last Name] resulting something similar H. John Doe.
    // UserName = The user's chosen username, which should be unique. Check for uniqueness before allowing the user to set this value. And if it contains anything other than letters, numbers, and underscores, it should be rejected. The username should be case insensitive. And anything vulgar or offensive should be rejected. The username should be between 3 and 20 characters long. Identity and AccountValidator enforce these rules; the configurable blocklist is baseline moderation.
    // Email = The user's email address, which should be unique. Check for uniqueness before allowing the user to set this value. And if it is not a valid email address, it should be rejected.
    // PasswordHash = The user's password hash, inherited from IdentityUser and hashed by UserManager; never set it from an HTTP request. The password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
    // AdoptedOrganizationId = Stable UUID of the organization the user has adopted (shared by many users), the user can change this at anytime they wish, this is another cosmetic value. Changing the organization will not change any of the user's data, it is only a cosmetic value. Null represents the default organization my.circa.archive; resolve display codes through the future organization module.
    // DisplayEmail =  This is a display only email, and is not used for authentication, or any functionality. It is only used for display purposes, it should be unique, and the structure is [DisplayID]@my.circa.archive.
    // Role (UserType) = The type of user, which by default is "author" to preserve auth contracts.
    // IsActive = A boolean value indicating whether the user is active or not. By default, this should be true.
    // IsBanned = A boolean value indicating whether the user is banned or not. By default, this should be false.
    // StrikeCount = The number of strikes the user has received. By default, this should be 0. Max is 5 strikes, after which the user will be banned.
    // LastStrikeAt = The date and time the user received their last strike. This is used to determine if the user should be banned or not.
    // RestrictedUntil = The date and time the user is restricted until. This is used to determine if the user is allowed to enter the archive.
    // CreatedAt = The date and time the user was created.
    // DeletedAt = The date and time the user was deleted. This is a soft delete, and the user can be restored by an admin. By default, this should be null. Permanent deletion requires a separate coordinated erasure workflow, which is not implemented.
    // UpdatedAt = The date and time the user was last updated.
    // LastLoginAt = The date and time the user last logged in.
    // LastLogoutAt = The date and time the user last logged out.
    // ActivityIPList = A list of IP addresses the user has logged in from. This is used to detect suspicious activity, and to prevent account takeover. This should be a list of strings, and should be limited to the last 10 IP addresses.

    public string DisplayId { get; private set; } = NewDisplayId();
    public string DisplayName { get; private set; } = AnalystName.Generate();
    public Guid? AdoptedOrganizationId { get; private set; }
    public string DisplayEmail => $"{DisplayId}@my.circa.archive";
    public string Role { get; private set; } = "author";
    public bool IsActive { get; private set; } = true;
    public bool IsBanned { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }
    public DateTimeOffset? LastLogoutAt { get; private set; }
    public int StrikeCount { get; private set; }
    public DateTimeOffset? LastStrikeAt { get; private set; }
    public DateTimeOffset? RestrictedUntil { get; private set; }
    private List<string> _activityIPList = [];
    public IReadOnlyList<string> ActivityIPList => _activityIPList.AsReadOnly();

    public AppUser() { }

    public static AppUser Create(string username, string email, string role = "author", DateTimeOffset? now = null,
        string? displayName = null)
    {
        if (displayName is not null && !AnalystName.IsValid(displayName))
            throw new ArgumentException("Choose a generated analyst name.", nameof(displayName));
        var createdAt = now ?? DateTimeOffset.UtcNow;
        return new AppUser
        {
            Id = Guid.CreateVersion7(createdAt),
            UserName = username,
            Email = email,
            DisplayName = displayName ?? AnalystName.Generate(),
            Role = role,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            SecurityStamp = Guid.NewGuid().ToString()
        };
    }

    private static string NewDisplayId() => RandomNumberGenerator.GetInt32(1_000_000_000).ToString("D9");

    // Used only by the persistence store to retry a conflicting cosmetic ID on initial creation.
    public void RegenerateDisplayId() => DisplayId = NewDisplayId();

    public bool CanAccessArchive(DateTimeOffset now) =>
        IsActive && !IsBanned && DeletedAt is null && (RestrictedUntil is null || RestrictedUntil <= now);

    public bool CanPost(DateTimeOffset now) => CanAccessArchive(now);

    public void ApplyStrike(DateTimeOffset now, TimeSpan? restrictionDuration = null)
    {
        if (restrictionDuration < TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(restrictionDuration));
        StrikeCount = Math.Min(5, StrikeCount + 1);
        LastStrikeAt = now;
        if (restrictionDuration.HasValue)
        {
            var until = now.Add(restrictionDuration.Value);
            if (RestrictedUntil is null || until > RestrictedUntil) RestrictedUntil = until;
        }
        if (StrikeCount == 5) IsBanned = true;
        UpdatedAt = now;
    }

    public void SetRole(string role)
    {
        if (role is not ("author" or "moderator")) throw new ArgumentException("Unknown account role.", nameof(role));
        Role = role;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AdoptOrganization(Guid? organizationId, DateTimeOffset now)
    {
        if (organizationId == Guid.Empty) throw new ArgumentException("An organization ID cannot be empty.", nameof(organizationId));
        AdoptedOrganizationId = organizationId;
        UpdatedAt = now;
    }

    public void SetActive(bool active, DateTimeOffset now)
    {
        IsActive = active;
        UpdatedAt = now;
    }

    public void SoftDelete(DateTimeOffset now)
    {
        DeletedAt = now;
        UpdatedAt = now;
    }

    public void Restore(DateTimeOffset now)
    {
        DeletedAt = null;
        UpdatedAt = now;
    }

    public void RecordLogin(DateTimeOffset now, string? ipAddress = null)
    {
        LastLoginAt = now;
        UpdatedAt = now;
        if (IPAddress.TryParse(ipAddress, out var address))
        {
            var value = address.ToString();
            _activityIPList.Remove(value);
            _activityIPList.Add(value);
            if (_activityIPList.Count > 10) _activityIPList.RemoveAt(0);
        }
    }

    public void RecordLogout(DateTimeOffset now)
    {
        LastLogoutAt = now;
        UpdatedAt = now;
    }
}
