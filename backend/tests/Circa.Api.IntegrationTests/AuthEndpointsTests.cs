using System.Net;
using System.Net.Http.Json;
using Circa.Auth.Application;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class AuthEndpointsTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;

    public AuthEndpointsTests(PostgresFixture postgresFixture)
    {
        _factory = new ApiFactory { PostgresFixture = postgresFixture };
    }

    [Fact]
    public async Task Register_ValidRequest_Returns201AndUser()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var request = new RegisterRequest($"user_{unique}", $"user_{unique}@example.com", "Password123!");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(body);
        Assert.Equal($"user_{unique}", body.Username);
        Assert.Equal("author", body.Role);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Register_DuplicateUsername_Returns409()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var request = new RegisterRequest($"dup_{unique}", $"dup_{unique}@example.com", "Password123!");

        var response1 = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        Assert.Equal(HttpStatusCode.Created, response1.StatusCode);

        var request2 = new RegisterRequest($"dup_{unique}", $"other_{unique}@example.com", "Password123!");
        var response2 = await client.PostAsJsonAsync("/api/v1/auth/register", request2);

        Assert.Equal(HttpStatusCode.Conflict, response2.StatusCode);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns400()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var request = new RegisterRequest($"weak_{unique}", $"weak_{unique}@example.com", "short");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200AndUser()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var registerRequest = new RegisterRequest($"login_{unique}", $"login_{unique}@example.com", "Password123!");

        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var loginRequest = new LoginRequest($"login_{unique}", "Password123!");
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        Assert.Equal($"login_{unique}", body.Username);
        Assert.Equal("author", body.Role);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401WithGenericBody()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var registerRequest = new RegisterRequest($"wrong_{unique}", $"wrong_{unique}@example.com", "Password123!");

        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        var loginRequest = new LoginRequest($"wrong_{unique}", "WrongPassword123!");
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
        var str = await loginResponse.Content.ReadAsStringAsync();
        Assert.Contains("invalid_credentials", str);
    }

    [Fact]
    public async Task Login_TenFailures_LocksOutAccountAndReturns423()
    {
        _factory.Overrides["Auth:LoginRateLimitPermitLimit"] = "100";
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var registerRequest = new RegisterRequest($"lock_{unique}", $"lock_{unique}@example.com", "Password123!");

        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        for (int i = 0; i < 10; i++)
        {
            var failedLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest($"lock_{unique}", "WrongPassword!"));
            if (i < 9)
            {
                Assert.Equal(HttpStatusCode.Unauthorized, failedLogin.StatusCode);
            }
        }

        var lockedResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest($"lock_{unique}", "WrongPassword!"));
        Assert.Equal((HttpStatusCode)423, lockedResponse.StatusCode);
    }
}
