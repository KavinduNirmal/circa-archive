using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Circa.Auth.Application;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Auth.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class AuthorizationPolicyTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;

    public AuthorizationPolicyTests(PostgresFixture postgresFixture)
    {
        _factory = new ApiFactory { PostgresFixture = postgresFixture };
    }

    private static StringContent CreateJsonPayload(object obj) =>
        new(System.Text.Json.JsonSerializer.Serialize(obj), Encoding.UTF8, "application/json");

    [Fact]
    public async Task Author_WithLiveSession_CanPostRecord_Returns201()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"auth_{unique}", $"auth_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);

        var token = TestTokenFactory.CreateToken(user.Id, user.Username, user.Role, sessionId: session.Id);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/v1/records", CreateJsonPayload(new { title = "Valid Record" }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Author_WithRevokedSession_PostRecord_Returns401_RevocationGuarantee()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"revk_{unique}", $"revk_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        Guid sessionId;
        using (var scope = _factory.Services.CreateScope())
        {
            var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);
            sessionId = session.Id;

            // Revoke the session
            await sessionService.RevokeSessionAsync(sessionId, DateTimeOffset.UtcNow, "test_revocation");
        }

        // Even with a valid unexpired JWT containing the revoked sid, write must return 401
        var token = TestTokenFactory.CreateToken(user.Id, user.Username, user.Role, sessionId: sessionId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/v1/records", CreateJsonPayload(new { title = "Revoked Record" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Author_WithActivePostingRestriction_PostRecord_Returns403()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"restr_{unique}", $"restr_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        Guid sessionId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);
            sessionId = session.Id;

            var dbUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(dbUser);
            dbUser.ApplyStrike(DateTimeOffset.UtcNow, TimeSpan.FromDays(7));
            await db.SaveChangesAsync();
        }

        var token = TestTokenFactory.CreateToken(user.Id, user.Username, user.Role, sessionId: sessionId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/v1/records", CreateJsonPayload(new { title = "Restricted Post" }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Moderator_AccessModeratorEndpoint_Returns200()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        Guid modId;
        Guid sessionId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();

            var modUser = AppUser.Create($"mod_{unique}", $"mod_{unique}@example.com", "moderator");
            db.Users.Add(modUser);
            await db.SaveChangesAsync();
            modId = modUser.Id;

            var (session, _) = await sessionService.CreateSessionAsync(modId, DateTimeOffset.UtcNow);
            sessionId = session.Id;
        }

        var token = TestTokenFactory.CreateToken(modId, $"mod_{unique}", "moderator", sessionId: sessionId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/moderation/probe");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Author_AccessModeratorEndpoint_Returns403()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"author_mod_{unique}", $"author_mod_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);

        var token = TestTokenFactory.CreateToken(user.Id, user.Username, "author", sessionId: session.Id);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/moderation/probe");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_AccessModeratorEndpoint_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/moderation/probe");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Moderator_AttemptVote_Returns403_StaffNeverRate()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        Guid modId;
        Guid sessionId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();

            var modUser = AppUser.Create($"mod_vote_{unique}", $"mod_vote_{unique}@example.com", "moderator");
            db.Users.Add(modUser);
            await db.SaveChangesAsync();
            modId = modUser.Id;

            var (session, _) = await sessionService.CreateSessionAsync(modId, DateTimeOffset.UtcNow);
            sessionId = session.Id;
        }

        var token = TestTokenFactory.CreateToken(modId, $"mod_vote_{unique}", "moderator", sessionId: sessionId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var recordId = Guid.NewGuid();
        var response = await client.PostAsync($"/api/v1/records/{recordId}/vote", CreateJsonPayload(new { value = 1 }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Author_AttemptVote_Returns200()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"vote_auth_{unique}", $"vote_auth_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);

        var token = TestTokenFactory.CreateToken(user.Id, user.Username, "author", sessionId: session.Id);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var recordId = Guid.NewGuid();
        var response = await client.PostAsync($"/api/v1/records/{recordId}/vote", CreateJsonPayload(new { value = 1 }));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
