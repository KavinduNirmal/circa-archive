using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Circa.Auth.Application;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Auth.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class HardeningTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;

    public HardeningTests(PostgresFixture postgresFixture)
    {
        _factory = new ApiFactory { PostgresFixture = postgresFixture };
    }

    [Fact]
    public async Task RefreshLimit_FollowsSessionAcrossRotations_WithoutRevoking()
    {
        _factory.Overrides["Auth:RefreshRateLimitPermitLimit"] = "2";
        using var client = _factory.CreateClient();
        var name = $"flood_{Guid.NewGuid():N}"[..20];
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(name, $"{name}@example.com", "Password123!"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsync("/api/v1/records", null)).StatusCode);
    }

    [Fact]
    public async Task EmptyOriginAllowList_RejectsBrowserMutation()
    {
        _factory.Overrides["AllowedOrigins:0"] = "";
        using var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = JsonContent.Create(new LoginRequest("someone", "wrong"))
        };
        request.Headers.Add("Origin", "https://evil.test");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task LoginLimit_NormalizesIdentifierCase()
    {
        using var client = _factory.CreateClient();
        var identifier = $"case_{Guid.NewGuid():N}";
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/login",
                new LoginRequest(identifier, "wrong"))).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(identifier.ToUpperInvariant(), "wrong"))).StatusCode);
    }

    [Fact]
    public async Task SessionDeletion_CannotRevokeAnotherUsersSession()
    {
        using var first = _factory.CreateClient();
        using var second = _factory.CreateClient();
        foreach (var client in new[] { first, second })
        {
            var name = $"owner_{Guid.NewGuid():N}"[..20];
            Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/v1/auth/register",
                new RegisterRequest(name, $"{name}@example.com", "Password123!"))).StatusCode);
        }
        var sessions = await second.GetFromJsonAsync<SessionSummaryDto[]>("/api/v1/auth/sessions");
        Assert.Equal(HttpStatusCode.Forbidden, (await first.DeleteAsync($"/api/v1/auth/sessions/{sessions![0].Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await second.PostAsync("/api/v1/records", null)).StatusCode);
    }

    [Fact]
    public async Task RegistrationLimit_Returns429AfterThreeAttempts()
    {
        _factory.Overrides["Auth:RegisterRateLimitPermitLimit"] = "3";
        using var client = _factory.CreateClient();
        for (var i = 0; i < 3; i++)
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/v1/auth/register",
                new RegisterRequest("someone", "someone@example.com", "short"))).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("someone", "someone@example.com", "short"))).StatusCode);
    }

    [Theory]
    [InlineData("null")]
    [InlineData("https://circa.test, https://evil.test")]
    public async Task InvalidOrigins_AreRejected(string origin)
    {
        using var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        request.Headers.Add("Origin", origin);
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Contains("default-src 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
    }

    [Fact]
    public async Task LoginLimit_UsesBoundEndpointAndCaseInsensitiveJson()
    {
        _factory.Overrides["Auth:LoginRateLimitPermitLimit"] = "1";
        using var client = _factory.CreateClient();
        var identifier = $"alias_{Guid.NewGuid():N}";
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/login",
            new { identifier, password = "wrong" })).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/v1.0/auth/login/",
            new { Identifier = identifier, Password = "wrong" })).StatusCode);
    }

    private static StringContent CreateJsonPayload(object obj) =>
        new(JsonSerializer.Serialize(obj), Encoding.UTF8, "application/json");

    [Fact]
    public async Task Login_ThrottledAfter5Attempts_Returns429()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var username = $"brute_{unique}";
        var password = "Password123!";

        // Register user
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, $"{username}@example.com", password));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        // First 5 attempts with wrong password
        for (int i = 0; i < 5; i++)
        {
            var failedLogin = await client.PostAsJsonAsync("/api/v1/auth/login",
                new LoginRequest(username, "WrongPass123!"));
            Assert.Equal(HttpStatusCode.Unauthorized, failedLogin.StatusCode);
        }

        // 6th attempt should be throttled (429)
        var throttledResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(username, "WrongPass123!"));
        Assert.Equal((HttpStatusCode)429, throttledResponse.StatusCode);

        var problem = await throttledResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(429, problem.Status);
        Assert.True(problem.Extensions.ContainsKey("code"));
        Assert.Equal("rate_limit_exceeded", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task OriginMismatch_OnMutation_Returns403()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];

        // Mutation with an untrusted origin
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register")
        {
            Content = CreateJsonPayload(new RegisterRequest($"origin_{unique}", $"origin_{unique}@example.com", "Password123!"))
        };
        request.Headers.Add("Origin", "https://evil.attacker.com");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(403, problem.Status);
        Assert.True(problem.Extensions.ContainsKey("code"));
        Assert.Equal("origin_mismatch", problem.Extensions["code"]?.ToString());

        // Mutation with an allowed origin
        var allowedRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register")
        {
            Content = CreateJsonPayload(new RegisterRequest($"allowed_{unique}", $"allowed_{unique}@example.com", "Password123!"))
        };
        allowedRequest.Headers.Add("Origin", "https://circa.test");

        var allowedResponse = await client.SendAsync(allowedRequest);
        Assert.Equal(HttpStatusCode.Created, allowedResponse.StatusCode);
    }

    [Fact]
    public async Task LogEntries_ContainNoTokenSubstring()
    {
        TestLogSink.Clear();
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var username = $"logtest_{unique}";
        var password = "Password123!";

        // Register
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(username, $"{username}@example.com", password));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        // Login
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(username, password));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // Extract cookies
        var cookies = loginResponse.Headers.GetValues("Set-Cookie").ToList();
        var atCookie = cookies.FirstOrDefault(c => c.Contains(AuthEndpoints.AccessTokenCookieName));
        var rtCookie = cookies.FirstOrDefault(c => c.Contains(AuthEndpoints.RefreshTokenCookieName));
        Assert.NotNull(atCookie);
        Assert.NotNull(rtCookie);

        var rawAccessToken = atCookie.Split(';')[0].Split('=')[1];
        var rawRefreshToken = rtCookie.Split(';')[0].Split('=')[1];

        // Refresh
        var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshReq.Headers.Add("Cookie", $"{AuthEndpoints.RefreshTokenCookieName}={rawRefreshToken}");
        var refreshResponse = await client.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.NoContent, refreshResponse.StatusCode);

        // Logout
        var logoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logoutReq.Headers.Add("Cookie", $"{AuthEndpoints.RefreshTokenCookieName}={rawRefreshToken}");
        var logoutResponse = await client.SendAsync(logoutReq);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        // Assert on captured logs
        var allLogs = string.Join("\n", TestLogSink.Logs);

        // Verify tokens are never logged
        Assert.DoesNotContain(rawAccessToken, allLogs);
        Assert.DoesNotContain(rawRefreshToken, allLogs);
        Assert.DoesNotContain(password, allLogs);

        // Verify structured events were recorded
        Assert.Contains("AuthEvent.LoginSuccess", allLogs);
        Assert.Contains("AuthEvent.RefreshSuccess", allLogs);
        Assert.Contains("AuthEvent.Logout", allLogs);
    }

    [Fact]
    public async Task ProblemDetails_CodeIsPresentOn401()
    {
        using var client = _factory.CreateClient();

        // 1. Unauthenticated access to protected endpoint
        var anonResponse = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, anonResponse.StatusCode);
        var anonProblem = await anonResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(anonProblem);
        Assert.True(anonProblem.Extensions.ContainsKey("code"));
        Assert.False(string.IsNullOrWhiteSpace(anonProblem.Extensions["code"]?.ToString()));

        // 2. Login with invalid credentials
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest("nonexistent_user", "WrongPassword123!"));
        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
        var loginProblem = await loginResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(loginProblem);
        Assert.Equal("invalid_credentials", loginProblem.Extensions["code"]?.ToString());

        // 3. Refresh with missing or invalid token
        var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshReq.Headers.Add("Cookie", $"{AuthEndpoints.RefreshTokenCookieName}=invalid_fake_token");
        var refreshResponse = await client.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
        var refreshProblem = await refreshResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(refreshProblem);
        Assert.Equal("session_expired", refreshProblem.Extensions["code"]?.ToString());
    }
}
