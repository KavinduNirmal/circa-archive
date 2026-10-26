using System.Net;
using System.Net.Http.Headers;
using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Archive.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Security.Claims;
using System.Net.Http.Json;
using System.Text.Json;
using Circa.Archive.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Api.IntegrationTests;

public sealed class SearchEndpointTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    private async Task<ApiFactory> FactoryAsync()
    {
        var factory = new ApiFactory { PostgresFixture = postgres };
        await using var scope = factory.Services.CreateAsyncScope();
        await ArchiveSchemaInitializer.EnsureAsync(scope.ServiceProvider.GetRequiredService<ArchiveDbContext>());
        return factory;
    }

    [Fact]
    public async Task AnonymousAndInvalidCookiesReceiveUncachedSearchContract()
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", "circa_at=invalid; circa_rt=stale");
        var response = await client.GetAsync("/api/v1/search?type=incident&type=organization&lang=ko&limit=10&page=2");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl!.Private);
        Assert.True(response.Headers.CacheControl.NoStore);
        Assert.Contains("Cookie", response.Headers.Vary);
        Assert.Contains("rel=\"first\"", string.Join(",", response.Headers.GetValues("Link")));
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ko", body.GetProperty("applied").GetProperty("language").GetString());
        Assert.Equal(2, body.GetProperty("applied").GetProperty("type").GetArrayLength());
        Assert.Equal(2, body.GetProperty("page").GetProperty("number").GetInt32());
        Assert.True(body.TryGetProperty("items", out _));
        Assert.True(body.TryGetProperty("facets", out _));
        Assert.Equal("ko", body.GetProperty("meta").GetProperty("language").GetString());
    }

    [Theory]
    [InlineData("language=fr", "language")]
    [InlineData("page=101", "page")]
    [InlineData("from=2026-02-30", "from")]
    [InlineData("type=memo", "type")]
    [InlineData("q=one&q=two", "q")]
    [InlineData("q=safe%00unsafe", "q")]
    public async Task InvalidQueryReturnsProblemDetails(string query, string key)
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/search?" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("invalid_search_filter", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("errors").TryGetProperty(key, out _));
        Assert.Contains("Cookie", response.Headers.Vary);
    }

    [Fact]
    public async Task InvalidCursorReturnsItsDocumentedProblemCode()
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/search?cursor=invalid");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("invalid_cursor", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task OversizedUrlIsRejected()
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/v1/search?unknown=" + new string('x', 4096))).StatusCode);
    }

    [Fact]
    public async Task RateLimitIncludesRetryAfterAndPrivateCacheHeaders()
    {
        await using var factory = await FactoryAsync();
        await using var limited = new ApiFactory { PostgresFixture = postgres };
        limited.Overrides["Search:PermitLimit"] = "2";
        using var client = limited.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
        var response = await client.GetAsync("/api/v1/search");
        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(response.Headers.RetryAfter);
        Assert.True(response.Headers.CacheControl!.Private);
        Assert.True(response.Headers.CacheControl.NoStore);
        Assert.Contains("Cookie", response.Headers.Vary);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("rate_limit_exceeded", body.GetProperty("code").GetString());
    }
    [Fact]
    public async Task AuthenticatedSearchUsesASeparateUserBudget()
    {
        await using var factory = await FactoryAsync();
        await using var limited = new ApiFactory { PostgresFixture = postgres };
        limited.Overrides["Search:PermitLimit"] = "1";
        limited.Overrides["Search:AuthenticatedPermitLimit"] = "2";
        using var client = limited.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/api/v1/search")).StatusCode);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(Guid.NewGuid(), "reader"));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/api/v1/search")).StatusCode);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(Guid.NewGuid(), "other_reader"));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/search")).StatusCode);
    }

    [Fact]
    public async Task OnlyALiveApprovedReaderCanSearchSealedRecordBodies()
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        async Task<(RegisterResponse User, Guid SessionId)> RegisterAsync()
        {
            var name = "search_" + Guid.NewGuid().ToString("N")[..8];
            var response = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(name, name + "@example.com", "Password123!"));
            response.EnsureSuccessStatusCode();
            var user = (await response.Content.ReadFromJsonAsync<RegisterResponse>())!;
            await using var authScope = factory.Services.CreateAsyncScope();
            var auth = authScope.ServiceProvider.GetRequiredService<AuthDbContext>();
            var session = await auth.Sessions.SingleAsync(x => x.UserId == user.Id);
            return (user, session.Id);
        }
        var reader = await RegisterAsync();
        var owner = await RegisterAsync();
        var secret = "opaque" + Guid.NewGuid().ToString("N");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
        var incident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 9000001, Designation = "Public title", Markdown = "Public prose", AuthorId = owner.User.Id, ContentHash = "a" };
        var record = new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), ReferenceNumber = 9000001, Code = "EXP-9000001", Incident = incident, AuthorId = owner.User.Id, AccessPolicy = AccessPolicy.Sealed, Markdown = secret, ContentHash = "b" };
        db.Records.Add(record);
        db.RecordAccessRequests.Add(new RecordAccessRequest { Id = Guid.NewGuid(), Record = record, RequesterId = reader.User.Id, Status = AccessRequestStatus.Approved, DecidedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(owner.User.Id, owner.User.Username, "moderator", owner.SessionId));
        var unapproved = await client.GetFromJsonAsync<JsonElement>("/api/v1/search?q=" + secret);
        Assert.Empty(unapproved.GetProperty("items").EnumerateArray());
        var stub = await client.GetFromJsonAsync<JsonElement>("/api/v1/search?q=EXP-9000001");
        Assert.True(stub.GetProperty("items")[0].GetProperty("redacted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, stub.GetProperty("items")[0].GetProperty("excerpt").ValueKind);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(reader.User.Id, reader.User.Username, sessionId: reader.SessionId));
        var approved = await client.GetFromJsonAsync<JsonElement>("/api/v1/search?q=" + secret);
        Assert.Equal(secret, approved.GetProperty("items")[0].GetProperty("excerpt").GetString());
        var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        await authDb.Sessions.Where(x => x.Id == reader.SessionId).ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, DateTimeOffset.UtcNow));
        var revoked = await client.GetAsync("/api/v1/search?q=" + secret);
        Assert.Equal(HttpStatusCode.OK, revoked.StatusCode);
        Assert.Empty((await revoked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task DatabaseTimeoutReturnsUnavailableWithoutLeakingDetails()
    {
        await using var factory = await FactoryAsync();
        using var client = factory.CreateClient();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.Database.ExecuteSqlRawAsync("LOCK TABLE archive.incidents IN ACCESS EXCLUSIVE MODE");
        var response = await client.GetAsync("/api/v1/search?q=timeout-check");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.True(response.Headers.CacheControl!.NoStore);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("search_unavailable", problem.GetProperty("code").GetString());
        Assert.False(problem.TryGetProperty("exception", out _));
        Assert.False(problem.TryGetProperty("detail", out _));
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task UnexpectedFailuresReturnGenericProblemDetails()
    {
        await using var factory = await FactoryAsync();
        await using var failing = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.RemoveAll<IAuthorizationService>();
            services.AddSingleton<IAuthorizationService, FailingViewerAuthorization>();
        }));
        using var client = failing.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(Guid.NewGuid(), "reader"));
        var response = await client.GetAsync("/api/v1/search");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("private diagnostic", body);
        var problem = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("search_failed", problem.GetProperty("code").GetString());
        Assert.True(response.Headers.CacheControl!.NoStore);
    }

    private sealed class FailingViewerAuthorization : IAuthorizationService
    {
        public Task<AuthorizationResult> AuthorizeAsync(ClaimsPrincipal user, object? resource, IEnumerable<IAuthorizationRequirement> requirements)
            => throw new InvalidOperationException("private diagnostic");
        public Task<AuthorizationResult> AuthorizeAsync(ClaimsPrincipal user, object? resource, string policyName)
            => throw new InvalidOperationException("private diagnostic");
    }

}
