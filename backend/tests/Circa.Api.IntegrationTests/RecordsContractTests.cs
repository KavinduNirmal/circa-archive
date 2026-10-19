using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class RecordsContractTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public RecordsContractTests(ApiFactory factory)
    {
        _factory = factory;
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
        var token = TestTokenFactory.CreateToken(Guid.NewGuid(), "testauthor", "author");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var content = new StringContent("{\"title\":\"Test\"}", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/v1/records", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
