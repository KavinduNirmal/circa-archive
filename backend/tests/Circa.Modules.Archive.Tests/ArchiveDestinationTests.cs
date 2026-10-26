using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Search;

namespace Circa.Modules.Archive.Tests;

public sealed class ArchiveDestinationTests(ArchivePostgresFixture fixture) : IClassFixture<ArchivePostgresFixture>
{
    [Fact]
    public async Task Sealed_incident_requires_acknowledgment_and_hidden_entries_stay_absent()
    {
        await using var db = fixture.CreateContext();
        var incident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 987654, Designation = "Destination", Markdown = "incident secret", AccessPolicy = AccessPolicy.Sealed, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var reader = new ArchiveDestinationReader(db);
        Assert.Null((await reader.ReadAsync("INC-987654", incident.AuthorId))!.Markdown);
        Assert.Equal("incident secret", (await reader.ReadAsync("INC-987654", null, true))!.Markdown);
        incident.AccessPolicy = AccessPolicy.Restricted;
        await db.SaveChangesAsync();
        Assert.Null(await reader.ReadAsync("INC-987654", incident.AuthorId, true));
        incident.AccessPolicy = AccessPolicy.Public;
        incident.RecordStatus = RecordStatus.Erased;
        await db.SaveChangesAsync();
        Assert.Null(await reader.ReadAsync("INC-987654", null, true));
    }

    [Fact]
    public async Task Sealed_record_requires_decided_approval_even_for_author_and_rumours_have_real_anchors()
    {
        await using var db = fixture.CreateContext();
        var owner = Guid.NewGuid();
        var approved = Guid.NewGuid();
        var incident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 987655, Designation = "Parent", Markdown = "parent", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var record = new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), Incident = incident, ReferenceNumber = 987654, Code = "EXP-987654", AuthorId = owner, AccessPolicy = AccessPolicy.Sealed, Markdown = "record secret", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Records.Add(record);
        db.Records.Add(new Circa.Archive.Domain.Record { Id = Guid.NewGuid(), Incident = incident, RecordType = RecordType.Rumour, ReferenceNumber = 987655, Markdown = "rumour body", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        var request = new RecordAccessRequest { Id = Guid.NewGuid(), Record = record, RequesterId = approved, Status = AccessRequestStatus.Pending, CreatedAt = DateTimeOffset.UtcNow };
        db.RecordAccessRequests.Add(request);
        await db.SaveChangesAsync();
        var reader = new ArchiveDestinationReader(db);
        Assert.Null((await reader.ReadAsync(record.Code, owner, true))!.Markdown);
        Assert.Null((await reader.ReadAsync(record.Code, approved, true))!.Markdown);
        request.Status = AccessRequestStatus.Approved;
        await db.SaveChangesAsync();
        Assert.Null((await reader.ReadAsync(record.Code, approved))!.Markdown);
        request.DecidedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        Assert.Equal("record secret", (await reader.ReadAsync(record.Code, approved))!.Markdown);
        Assert.Equal("rumour-987655", Assert.Single((await reader.ReadAsync("INC-987655", null))!.Rumours).Code);
        db.Tombstones.Add(new Tombstone { Id = Guid.NewGuid(), Record = record, TombstonedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        Assert.Null(await reader.ReadAsync(record.Code, approved));
    }
}
