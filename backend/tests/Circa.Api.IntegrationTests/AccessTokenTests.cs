using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Circa.Auth.Application;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class AccessTokenTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;

    public AccessTokenTests(PostgresFixture postgresFixture)
    {
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

    private static string? ExtractRawCookieHeader(HttpResponseMessage response, string cookieName)
    {
        if (response.Headers.TryGetValues("Set-Cookie", out var cookieHeaders))
        {
            foreach (var header in cookieHeaders)
            {
                if (header.StartsWith($"{cookieName}="))
                {
                    return header;
                }
            }
        }
        return null;
    }

    [Fact]
    public async Task Authenticate_WithValidToken_Returns200AndResolvesSubAndRole()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"jwt_{unique}", $"jwt_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);
        var regUser = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(regUser);

        var token = ExtractCookie(regResponse, "circa_at");
        Assert.NotNull(token);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var me = await response.Content.ReadFromJsonAsync<UserMeResponse>();
        Assert.NotNull(me);
        Assert.Equal(regUser.Id, me.Id);
        Assert.Equal(regUser.Username, me.Username);
        Assert.Equal("author", me.Role);
    }

    [Fact]
    public async Task Authenticate_WithTokenExpired5SecondsAgo_Returns401DueToZeroClockSkew()
    {
        using var client = _factory.CreateClient();
        var expiredToken = TestTokenFactory.CreateToken(
            Guid.NewGuid(),
            "expired_user",
            "author",
            expiresAt: DateTime.UtcNow.AddSeconds(-5));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);

        var response = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Authenticate_WithTokenSignedByUntrustedKey_Returns401()
    {
        using var client = _factory.CreateClient();
        var untrustedToken = TestTokenFactory.CreateToken(
            Guid.NewGuid(),
            "untrusted_user",
            "author",
            signingKey: "AnotherSecretKeyThatIsNotTrustedByTheApi12345=");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", untrustedToken);

        var response = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Authenticate_WithAccessTokenCookie_Returns200()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"cookie_{unique}", $"cookie_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);
        var regUser = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(regUser);

        var accessToken = ExtractCookie(regResponse, "circa_at");
        Assert.NotNull(accessToken);

        // Send request with cookie instead of Authorization header
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Add("Cookie", $"circa_at={accessToken}");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.Content.ReadFromJsonAsync<UserMeResponse>();
        Assert.NotNull(me);
        Assert.Equal(regUser.Id, me.Id);
    }

    [Fact]
    public async Task RegisterAndLogin_SetHttpOnlyCookiesWithCorrectScopeAndAttributes()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"attrs_{unique}", $"attrs_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var atCookieHeader = ExtractRawCookieHeader(regResponse, "circa_at");
        Assert.NotNull(atCookieHeader);
        Assert.Contains("httponly", atCookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/", atCookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", atCookieHeader, StringComparison.OrdinalIgnoreCase);

        var rtCookieHeader = ExtractRawCookieHeader(regResponse, "circa_rt");
        Assert.NotNull(rtCookieHeader);
        Assert.Contains("httponly", rtCookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/;", rtCookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", rtCookieHeader, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Refresh_IssuesNewAccessTokenAndRotatesRefreshToken()
    {
        using var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
            AllowAutoRedirect = false
        });

        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"rfsh_{unique}", $"rfsh_{unique}@example.com", "Password123!"));
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var originalAt = ExtractCookie(regResponse, "circa_at");
        var originalRt = ExtractCookie(regResponse, "circa_rt");
        Assert.NotNull(originalAt);
        Assert.NotNull(originalRt);

        var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshReq.Headers.Add("Cookie", $"circa_rt={originalRt}");

        var refreshResponse = await client.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.NoContent, refreshResponse.StatusCode);

        var newAt = ExtractCookie(refreshResponse, "circa_at");
        var newRt = ExtractCookie(refreshResponse, "circa_rt");
        Assert.NotNull(newAt);
        Assert.NotNull(newRt);
        Assert.NotEqual(originalAt, newAt);
        Assert.NotEqual(originalRt, newRt);
    }
}

public sealed record UserMeResponse(Guid Id, string Username, string Role, DateTimeOffset CreatedAt);
