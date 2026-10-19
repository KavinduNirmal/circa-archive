using System.Net;
using System.Net.Http.Json;
using Circa.Auth.Application;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class SessionRefreshTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;
    private readonly PostgresFixture _fixture;

    public SessionRefreshTests(PostgresFixture postgresFixture)
    {
        _fixture = postgresFixture;
        _factory = new ApiFactory { PostgresFixture = postgresFixture };
    }

    private static string? ExtractCookie(HttpResponseMessage response, string cookieName)
    {
        if (response.Headers.TryGetValues("Set-Cookie", out var cookieHeaders))
        {
            foreach (var header in cookieHeaders)
            {
                if (header.StartsWith($"{cookieName}="))
                {
                    var valuePart = header.Split(';')[0];
                    return valuePart[(cookieName.Length + 1)..];
                }
            }
        }
        return null;
    }

    private HttpClient CreateClient() =>
        _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
            AllowAutoRedirect = false
        });

    [Fact]
    public async Task Refresh_ValidToken_RotatesTokenAndReturns204WithNewCookie()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"ref_{unique}", $"ref_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var originalCookie = ExtractCookie(registerResponse, "circa_rt");
        Assert.NotNull(originalCookie);

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add("Cookie", $"circa_rt={originalCookie}");

        var refreshResponse = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NoContent, refreshResponse.StatusCode);

        var rotatedCookie = ExtractCookie(refreshResponse, "circa_rt");
        Assert.NotNull(rotatedCookie);
        Assert.NotEqual(originalCookie, rotatedCookie);
    }

    [Fact]
    public async Task Refresh_OldTokenInsideGracePeriod_ReturnsSameReplacementAndDoesNotRevoke()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"grace_{unique}", $"grace_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var originalCookie = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(originalCookie);

        // First rotation
        var req1 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req1.Headers.Add("Cookie", $"circa_rt={originalCookie}");
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.NoContent, res1.StatusCode);
        var replacement1 = ExtractCookie(res1, "circa_rt");
        Assert.NotNull(replacement1);

        // Second rotation attempt with OLD token inside grace period
        var req2 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req2.Headers.Add("Cookie", $"circa_rt={originalCookie}");
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.NoContent, res2.StatusCode);
        var replacement2 = ExtractCookie(res2, "circa_rt");

        // Must return identical replacement token without revoking
        Assert.Equal(replacement1, replacement2);

        // Verify session is still live
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var user = await db.Users.SingleAsync(u => u.UserName == $"grace_{unique}");
        var session = await db.Sessions.SingleAsync(s => s.UserId == user.Id);
        Assert.Null(session.RevokedAt);
    }

    [Fact]
    public async Task Refresh_OldTokenAfterGracePeriod_RevokesSessionAndReturns401()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"replay_{unique}", $"replay_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var originalCookie = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(originalCookie);

        // First rotation
        var req1 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req1.Headers.Add("Cookie", $"circa_rt={originalCookie}");
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.NoContent, res1.StatusCode);

        // Manipulate grace period to be in the past to simulate expired grace
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var user = await db.Users.SingleAsync(u => u.UserName == $"replay_{unique}");
            var session = await db.Sessions.SingleAsync(s => s.UserId == user.Id);
            // Expire grace
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE auth.sessions SET previous_grace_until = {DateTimeOffset.UtcNow.AddMinutes(-1)} WHERE id = {session.Id}");
        }

        // Second rotation with old token after grace window expired -> Replay!
        var req2 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req2.Headers.Add("Cookie", $"circa_rt={originalCookie}");
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.Unauthorized, res2.StatusCode);

        // Verify session was revoked due to replay
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var user = await db.Users.SingleAsync(u => u.UserName == $"replay_{unique}");
            var session = await db.Sessions.SingleAsync(s => s.UserId == user.Id);
            Assert.NotNull(session.RevokedAt);
            Assert.Equal("refresh_reuse", session.RevokedReason);
        }
    }

    [Fact]
    public async Task Refresh_ConcurrentRequests_BothSucceedAndReceiveSameReplacement()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"concurrent_{unique}", $"concurrent_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var cookie = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(cookie);

        // Launch two concurrent refresh requests with the same cookie
        var task1 = Task.Run(async () =>
        {
            using var c = CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
            req.Headers.Add("Cookie", $"circa_rt={cookie}");
            return await c.SendAsync(req);
        });

        var task2 = Task.Run(async () =>
        {
            using var c = CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
            req.Headers.Add("Cookie", $"circa_rt={cookie}");
            return await c.SendAsync(req);
        });

        var responses = await Task.WhenAll(task1, task2);

        Assert.Equal(HttpStatusCode.NoContent, responses[0].StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, responses[1].StatusCode);

        var rep1 = ExtractCookie(responses[0], "circa_rt");
        var rep2 = ExtractCookie(responses[1], "circa_rt");

        Assert.NotNull(rep1);
        Assert.NotNull(rep2);
        Assert.Equal(rep1, rep2);

        // Session must be alive
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var user = await db.Users.SingleAsync(u => u.UserName == $"concurrent_{unique}");
        var session = await db.Sessions.SingleAsync(s => s.UserId == user.Id);
        Assert.Null(session.RevokedAt);
    }

    [Fact]
    public async Task Refresh_ExpiredSession_Returns401()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"exp_{unique}", $"exp_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var cookie = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(cookie);

        // Expire the session in database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var user = await db.Users.SingleAsync(u => u.UserName == $"exp_{unique}");
            var session = await db.Sessions.SingleAsync(s => s.UserId == user.Id);
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE auth.sessions SET expires_at = {DateTimeOffset.UtcNow.AddMinutes(-5)} WHERE id = {session.Id}");
        }

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req.Headers.Add("Cookie", $"circa_rt={cookie}");
        var res = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesSession_AndSubsequentRefreshReturns401()
    {
        using var client = CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"logout_{unique}", $"logout_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var cookie = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(cookie);

        // Call Logout
        var logoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logoutReq.Headers.Add("Cookie", $"circa_rt={cookie}");
        var logoutRes = await client.SendAsync(logoutReq);
        Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);

        // Subsequent refresh with that token must return 401
        var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshReq.Headers.Add("Cookie", $"circa_rt={cookie}");
        var refreshRes = await client.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshRes.StatusCode);
    }
}
