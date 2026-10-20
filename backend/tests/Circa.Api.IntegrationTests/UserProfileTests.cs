using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Circa.Auth.Application;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Api.IntegrationTests;

public sealed class UserProfileTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory = new() { PostgresFixture = postgres };

    [Fact]
    public async Task Registration_PersistsChosenProfileAndLoginLogoutHistory()
    {
        using var client = _factory.CreateClient();
        var preview = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/display-name");
        var name = preview.GetProperty("displayName").GetString()!;
        Assert.True(AnalystName.IsValid(name));
        var username = $"profile_{Guid.NewGuid():N}"[..20];
        var response = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, $"{username}@example.com", "Password123!", name));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var registered = (await response.Content.ReadFromJsonAsync<RegisterResponse>())!;
        var profile = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/me");
        Assert.Equal(name, profile.GetProperty("displayName").GetString());
        var displayId = profile.GetProperty("displayId").GetString()!;
        Assert.Matches("^[0-9]{9}$", displayId);
        Assert.Equal($"{displayId}@my.circa.archive", profile.GetProperty("displayEmail").GetString());
        Assert.False(profile.TryGetProperty("activityIPList", out _));
        Assert.False(profile.TryGetProperty("passwordHash", out _));
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/v1/auth/logout", null)).StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var user = (await db.Users.FindAsync(registered.Id))!;
        Assert.Equal('7', user.Id.ToString()[14]);
        Assert.Equal(name, user.DisplayName);
        Assert.NotNull(user.LastLoginAt);
        Assert.NotNull(user.LastLogoutAt);
        Assert.NotEqual("Password123!", user.PasswordHash);
        Assert.True(await scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>().CheckPasswordAsync(user, "Password123!"));
    }

    [Theory]
    [InlineData("inactive", HttpStatusCode.Unauthorized)]
    [InlineData("banned", HttpStatusCode.Unauthorized)]
    [InlineData("deleted", HttpStatusCode.Unauthorized)]
    [InlineData("restricted", HttpStatusCode.Forbidden)]
    public async Task UnavailableAccount_IsDeniedForExistingSessionLoginAndRefresh(string state, HttpStatusCode expected)
    {
        using var client = _factory.CreateClient();
        var username = $"state_{Guid.NewGuid():N}"[..20];
        var response = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, $"{username}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var registered = (await response.Content.ReadFromJsonAsync<RegisterResponse>())!;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var user = (await db.Users.FindAsync(registered.Id))!;
            var now = DateTimeOffset.UtcNow;
            switch (state)
            {
                case "inactive": user.SetActive(false, now); break;
                case "deleted": user.SoftDelete(now); break;
                case "restricted": user.ApplyStrike(now, TimeSpan.FromDays(1)); break;
                case "banned": for (var i = 0; i < 5; i++) user.ApplyStrike(now); break;
            }
            await db.SaveChangesAsync();
        }
        Assert.Equal(expected, (await client.GetAsync("/api/v1/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/sessions")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(username, "Password123!"))).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
    }

    [Theory]
    [InlineData("password123!")]
    [InlineData("PASSWORD123!")]
    [InlineData("PasswordOnly!")]
    [InlineData("Password123")]
    public async Task Registration_RequiresEveryPasswordCategory(string password)
    {
        using var client = _factory.CreateClient();
        var username = $"pass_{Guid.NewGuid():N}"[..20];
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, $"{username}@example.com", password))).StatusCode);
    }

    [Fact]
    public async Task ConcurrentRegistrations_WithSameEmail_HaveOneWinner()
    {
        using var first = _factory.CreateClient();
        using var second = _factory.CreateClient();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var requests = new[] { (first, $"first_{suffix}"), (second, $"second_{suffix}") };
        var responses = await Task.WhenAll(requests.Select(async entry =>
            await entry.Item1.PostAsJsonAsync("/api/v1/auth/register",
                new RegisterRequest(entry.Item2, $"{suffix}@example.com", "Password123!"))));
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Created);
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Registration_UniquenessAndLoginAreCaseInsensitive()
    {
        using var client = _factory.CreateClient();
        var username = $"case_{Guid.NewGuid():N}"[..20];
        var email = $"{username}@example.com";
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, email, "Password123!"))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username.ToUpperInvariant(), "other@example.com", "Password123!"))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("other_analyst", email.ToUpperInvariant(), "Password123!"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email.ToUpperInvariant(), "Password123!"))).StatusCode);
    }

    [Fact]
    public async Task DisplayIdCollision_IsRetriedAndIpHistoryRoundTrips()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var first = AppUser.Create($"first_{suffix}", $"first_{suffix}@example.com");
        first.RecordLogin(DateTimeOffset.UtcNow, "192.0.2.1");
        Assert.True((await manager.CreateAsync(first, "Password123!")).Succeeded);
        var second = AppUser.Create($"second_{suffix}", $"second_{suffix}@example.com");
        db.Entry(second).Property(u => u.DisplayId).CurrentValue = first.DisplayId;
        Assert.True((await manager.CreateAsync(second, "Password123!")).Succeeded);
        Assert.NotEqual(first.DisplayId, second.DisplayId);
        db.ChangeTracker.Clear();
        var persisted = (await db.Users.FindAsync(first.Id))!;
        Assert.Equal(new[] { "192.0.2.1" }, persisted.ActivityIPList);
    }
}
