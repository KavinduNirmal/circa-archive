using System.Net.Http.Json;
using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Api.IntegrationTests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

internal static class SearchDestinationSeed
{
    public static async Task InitializeAsync(ApiFactory factory)
    {
        using var client = factory.CreateClient();
        var users = new List<Guid>();
        foreach (var name in new[] { "destination_reader", "destination_mod" })
        {
            var response = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(name, name + "@example.com", "Password123!"));
            response.EnsureSuccessStatusCode();
            users.Add((await response.Content.ReadFromJsonAsync<RegisterResponse>())!.Id);
        }
        await using var scope = factory.Services.CreateAsyncScope();
        var auth = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        await auth.Users.Where(u => u.Id == users[1]).ExecuteUpdateAsync(set => set.SetProperty(u => u.Role, "moderator"));
        var db = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
        await ArchiveSchemaInitializer.EnsureAsync(db);
        var incident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 880001, Designation = "API destination incident", Markdown = "The actual incident account. 한국어 기록", AuthorId = users[1], AccessPolicy = AccessPolicy.Sealed, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var record = new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), Incident = incident, Code = "EXP-880001", ReferenceNumber = 880001, AuthorId = users[1], Markdown = "The approved record account.", AccessPolicy = AccessPolicy.Sealed, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Records.Add(record);
        db.Records.Add(new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), Incident = incident, RecordType = RecordType.Rumour, ReferenceNumber = 880002, Markdown = "The actual rumour account.", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        db.Organizations.Add(new Organization { Id = Guid.NewGuid(), ReferenceNumber = 880001, Name = "API destination organization", Markdown = "The actual organization dossier.", FiledAt = DateTimeOffset.UtcNow, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        db.RecordAccessRequests.Add(new RecordAccessRequest { Id = Guid.NewGuid(), Record = record, RequesterId = users[0], Status = AccessRequestStatus.Approved, DecidedAt = DateTimeOffset.UtcNow, CreatedAt = DateTimeOffset.UtcNow });
        db.Characters.Add(new Character { Id = Guid.NewGuid(), ReferenceNumber = 880001, Name = "API destination character", Markdown = "The actual character dossier.", CreatedById = users[1], CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        db.Recoveries.Add(new Recovery { Id = Guid.NewGuid(), ReferenceNumber = 880001, Name = "API destination recovery", Description = "The actual recovery dossier. 한국어 회수품", RegisteredById = users[1], CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        for (var n = 0; n < 25; n++)
            db.Incidents.Add(new Incident { Id = Guid.NewGuid(), ReferenceNumber = 890000 + n, Designation = $"Pagination sample {n:D2}", HolderCode = "PAGINATION", Markdown = "Pagination body", AuthorId = users[1], CreatedAt = DateTimeOffset.UtcNow.AddMinutes(n), UpdatedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
    }
}
