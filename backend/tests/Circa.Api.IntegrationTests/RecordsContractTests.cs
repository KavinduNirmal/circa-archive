using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Xunit;

using System.Net.Http.Json;
using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Api.IntegrationTests;

public sealed class RecordsContractTests : IClassFixture<PostgresFixture>
{
    private readonly ApiFactory _factory;

    public RecordsContractTests(PostgresFixture postgresFixture)
    {
        _factory = new ApiFactory { PostgresFixture = postgresFixture };
    }

    [Fact]
    public async Task GetRecords_WithoutSession_Returns200()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/records");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PostRecords_WithoutSession_Returns401()
    {
        using var client = _factory.CreateClient();
        using var content = new StringContent("{\"title\":\"Test\"}", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/v1/records", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostRecords_WithValidAuthorToken_Returns201()
    {
        using var client = _factory.CreateClient();
        var unique = Guid.NewGuid().ToString("N")[..8];
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest($"rec_{unique}", $"rec_{unique}@example.com", "Password123!"));
        var user = await regResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        Assert.NotNull(user);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var session = await db.Sessions.FirstAsync(s => s.UserId == user.Id);

        var token = TestTokenFactory.CreateToken(user.Id, user.Username, "author", sessionId: session.Id);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var content = new StringContent("{\"title\":\"Test\"}", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/v1/records", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
