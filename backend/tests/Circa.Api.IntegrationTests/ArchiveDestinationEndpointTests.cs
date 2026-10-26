using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Circa.Api.IntegrationTests;

public sealed class ArchiveDestinationEndpointTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Search_destinations_enforce_visibility_live_sessions_and_idempotent_requests()
    {
        await using var factory = new ApiFactory { PostgresFixture = postgres };
        factory.ClientOptions.HandleCookies = false;
        using var client = factory.CreateClient();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
        await ArchiveSchemaInitializer.EnsureAsync(db);
        var name = "dest_" + Guid.NewGuid().ToString("N")[..8];
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(name, name + "@example.com", "Password123!"));
        registration.EnsureSuccessStatusCode();
        var user = (await registration.Content.ReadFromJsonAsync<RegisterResponse>())!;
        var auth = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var session = await auth.Sessions.SingleAsync(s => s.UserId == user.Id);
        var incident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 988001, Designation = "Destination incident", Markdown = "incident secret", AuthorId = user.Id, AccessPolicy = AccessPolicy.Sealed };
        var record = new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), Incident = incident, ReferenceNumber = 988001, Code = "EXP-988001", Markdown = "record secret", AuthorId = user.Id, AccessPolicy = AccessPolicy.Sealed };
        db.Records.Add(record);
        db.Organizations.Add(new Organization { Id = Guid.NewGuid(), ReferenceNumber = 988001, Name = "Real organization", Markdown = "organization dossier" });
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Add("Cookie", "circa_at=invalid");
        var response = await client.GetAsync("/api/v1/archive/INC-988001");
        Assert.True(response.Headers.CacheControl!.NoStore);
        Assert.Contains("Cookie", response.Headers.Vary);
        Assert.Equal(JsonValueKind.Null, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("markdown").ValueKind);
        var revealed = await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/INC-988001?acknowledge=true");
        Assert.Equal("incident secret", revealed.GetProperty("markdown").GetString());
        Assert.Equal("organization dossier", (await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/ORG-988001")).GetProperty("markdown").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/v1/archive/EXP-988001/access-requests", null)).StatusCode);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokenFactory.CreateToken(user.Id, name, "moderator", session.Id));
        Assert.Equal(JsonValueKind.Null, (await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/EXP-988001?acknowledge=true")).GetProperty("markdown").ValueKind);
        for (var i = 0; i < 2; i++)
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/v1/archive/EXP-988001/access-requests", null)).StatusCode);
        var request = await db.RecordAccessRequests.SingleAsync(r => r.RecordId == record.Id);
        Assert.Equal(AccessRequestStatus.Pending, request.Status);
        Assert.Equal(JsonValueKind.Null, (await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/EXP-988001")).GetProperty("markdown").ValueKind);
        request.Status = AccessRequestStatus.Approved;
        request.DecidedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        Assert.Equal("record secret", (await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/EXP-988001")).GetProperty("markdown").GetString());
        await auth.Sessions.Where(s => s.Id == session.Id).ExecuteUpdateAsync(set => set.SetProperty(s => s.RevokedAt, DateTimeOffset.UtcNow));
        Assert.Equal(JsonValueKind.Null, (await client.GetFromJsonAsync<JsonElement>("/api/v1/archive/EXP-988001")).GetProperty("markdown").ValueKind);
        incident.AccessPolicy = AccessPolicy.Restricted;
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/v1/archive/EXP-988001")).StatusCode);
    }
}
