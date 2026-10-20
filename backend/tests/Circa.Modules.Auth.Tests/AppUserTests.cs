using Circa.Auth.Domain;

namespace Circa.Modules.Auth.Tests;

public sealed class AppUserTests
{
    [Fact]
    public void Create_UsesVersionSevenIdentifier()
    {
        var user = AppUser.Create("analyst", "analyst@example.com");

        Assert.Equal('7', user.Id.ToString()[14]);
    }

    [Fact]
    public void FifthStrike_PreventsPostingEvenAfterRestrictionExpires()
    {
        var now = DateTimeOffset.UtcNow;
        var user = AppUser.Create("analyst", "analyst@example.com");
        for (var i = 0; i < 5; i++) user.ApplyStrike(now, TimeSpan.FromHours(1));

        Assert.False(user.CanPost(now.AddDays(1)));
        user.ApplyStrike(now);
        Assert.Equal(5, user.StrikeCount);
    }
    [Fact]
    public void Create_HasCosmeticProfileAndLifecycleDefaults()
    {
        var now = DateTimeOffset.UtcNow;
        var user = AppUser.Create("analyst", "real@example.com", now: now, displayName: "H. John Doe");
        Assert.Matches("^[0-9]{9}$", user.DisplayId);
        Assert.Equal("H. John Doe", user.DisplayName);
        Assert.Equal($"{user.DisplayId}@my.circa.archive", user.DisplayEmail);
        Assert.Null(user.AdoptedOrganizationId);
        Assert.True(user.IsActive);
        Assert.False(user.IsBanned);
        Assert.True(user.CanAccessArchive(now));
        Assert.Equal(now, user.UpdatedAt);
        Assert.Null(user.DeletedAt);
        Assert.Null(user.LastLoginAt);
        Assert.Null(user.LastLogoutAt);
        Assert.Empty(user.ActivityIPList);
    }

    [Fact]
    public void Lifecycle_EnforcesRestrictionsInactivityAndSoftDeletion()
    {
        var now = DateTimeOffset.UtcNow;
        var user = AppUser.Create("analyst", "analyst@example.com");
        user.ApplyStrike(now, TimeSpan.FromDays(1));
        user.ApplyStrike(now, TimeSpan.FromHours(1));
        Assert.False(user.CanAccessArchive(now.AddHours(2)));
        Assert.True(user.CanAccessArchive(now.AddDays(1)));
        user.SetActive(false, now);
        Assert.False(user.CanAccessArchive(now.AddDays(2)));
        user.SetActive(true, now);
        user.SoftDelete(now);
        Assert.False(user.CanAccessArchive(now.AddDays(2)));
        user.Restore(now);
        Assert.True(user.CanAccessArchive(now.AddDays(2)));
    }

    [Fact]
    public void RecordLogin_KeepsTenRecentDistinctValidAddresses()
    {
        var user = AppUser.Create("analyst", "analyst@example.com");
        var now = DateTimeOffset.UtcNow;
        for (var i = 1; i <= 12; i++) user.RecordLogin(now, $"192.0.2.{i}");
        user.RecordLogin(now, "192.0.2.3");
        user.RecordLogin(now, "invalid");
        Assert.Equal(10, user.ActivityIPList.Count);
        Assert.DoesNotContain("192.0.2.1", user.ActivityIPList);
        Assert.Equal("192.0.2.3", user.ActivityIPList[^1]);
        Assert.Equal(now, user.LastLoginAt);
        user.RecordLogout(now.AddMinutes(1));
        Assert.Equal(now.AddMinutes(1), user.LastLogoutAt);
    }

    [Fact]
    public void GeneratedNames_CanBeSelectedButArbitraryNamesCannot()
    {
        for (var i = 0; i < 100; i++) Assert.True(AnalystName.IsValid(AnalystName.Generate()));
        Assert.Throws<ArgumentException>(() => AppUser.Create("analyst", "analyst@example.com", displayName: "Arbitrary Name"));
    }
}
