using System.Data;
using Circa.Archive.Application;
using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Record = Circa.Archive.Domain.Record;

namespace Circa.Archive.Infrastructure.Search;

public sealed record ArchiveDestination(Guid Id, string Type, string Code, string Title, string? Markdown, string Access, string? RequestStatus, ArchiveDestination[] Rumours);

/// <summary>Scoped public destinations. Authorship and roles never grant sealed access.</summary>
public sealed class ArchiveDestinationReader(ArchiveDbContext database)
{
    private IQueryable<Record> VisibleRecords => database.Records.AsNoTracking().Where(r =>
        r.RecordStatus == RecordStatus.OnFile && r.AccessPolicy != AccessPolicy.Restricted &&
        !r.Tombstones.Any() && r.Incident != null &&
        r.Incident.RecordStatus == RecordStatus.OnFile && r.Incident.AccessPolicy != AccessPolicy.Restricted);

    public async Task<ArchiveDestination?> ReadAsync(string code, Guid? viewer, bool acknowledge = false, CancellationToken cancellationToken = default)
    {
        var parsed = SearchCode.Parse(code);
        if (parsed is null) return null;
        // Metadata, access decisions, and body are read from one consistent snapshot.
        await using var snapshot = await database.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);
        var canonical = parsed.Canonical;
        ArchiveDestination? result = null;
        if (canonical.StartsWith("INC-", StringComparison.Ordinal))
        {
            var number = long.Parse(canonical[4..], System.Globalization.CultureInfo.InvariantCulture);
            var incident = await database.Incidents.AsNoTracking().SingleOrDefaultAsync(i =>
                i.ReferenceNumber == number && i.RecordStatus == RecordStatus.OnFile && i.AccessPolicy != AccessPolicy.Restricted, cancellationToken);
            if (incident is not null)
            {
                var reveal = incident.AccessPolicy == AccessPolicy.Public || acknowledge;
                var rumours = reveal ? await VisibleRecords.Where(r => r.IncidentId == incident.Id && r.RecordType == RecordType.Rumour)
                    .OrderBy(r => r.ReferenceNumber).ToArrayAsync(cancellationToken) : [];
                var children = new List<ArchiveDestination>();
                foreach (var rumour in rumours) children.Add(await MapRecordAsync(rumour, viewer, cancellationToken));
                result = new(incident.Id, "incident", canonical, incident.Designation, reveal ? incident.Markdown : null,
                    incident.AccessPolicy == AccessPolicy.Sealed ? "sealed" : "public", null, children.ToArray());
            }
        }
        else if (canonical.StartsWith("ORG-", StringComparison.Ordinal))
        {
            var organizations = database.Organizations.AsNoTracking().Where(o => o.RecordStatus == RecordStatus.OnFile);
            var org = canonical.Count(c => c == '-') == 2
                ? await organizations.SingleOrDefaultAsync(o => o.LegacyCode == canonical, cancellationToken)
                : await organizations.SingleOrDefaultAsync(o => o.ReferenceNumber == long.Parse(canonical.Substring(4), System.Globalization.CultureInfo.InvariantCulture), cancellationToken);
            if (org is not null) result = new(org.Id, "organization", SearchCode.Format("ORG", org.ReferenceNumber), org.Name, org.Markdown, "public", null, []);
        }
        else if (canonical.StartsWith("EXP-", StringComparison.Ordinal) || canonical.StartsWith("EVI-", StringComparison.Ordinal))
        {
            var record = await VisibleRecords.SingleOrDefaultAsync(r => r.Code == canonical, cancellationToken);
            if (record is not null) result = await MapRecordAsync(record, viewer, cancellationToken);
        }
        else if (canonical.StartsWith("CHR-", StringComparison.Ordinal))
        {
            var number = long.Parse(canonical[4..], System.Globalization.CultureInfo.InvariantCulture);
            var character = await database.Characters.AsNoTracking().SingleOrDefaultAsync(c =>
                c.ReferenceNumber == number && c.RecordStatus == RecordStatus.OnFile, cancellationToken);
            if (character is not null) result = new(character.Id, "character", canonical,
                character.Name, character.Markdown, "public", null, []);
        }
        else if (canonical.StartsWith("ITM-", StringComparison.Ordinal))
        {
            var number = long.Parse(canonical[4..], System.Globalization.CultureInfo.InvariantCulture);
            var recovery = await database.Recoveries.AsNoTracking().SingleOrDefaultAsync(r =>
                r.ReferenceNumber == number && r.RegistryStatus == RegistryStatus.Active, cancellationToken);
            if (recovery is not null) result = new(recovery.Id, "recovery", canonical,
                recovery.Name, recovery.Description, "public", null, []);
        }
        await snapshot.CommitAsync(cancellationToken);
        return result;
    }

    private async Task<ArchiveDestination> MapRecordAsync(Record record, Guid? viewer, CancellationToken cancellationToken)
    {
        var requests = viewer is null ? [] : await database.RecordAccessRequests.AsNoTracking()
            .Where(r => r.RecordId == record.Id && r.RequesterId == viewer).ToArrayAsync(cancellationToken);
        var approved = requests.Any(r => r.Status == AccessRequestStatus.Approved && r.DecidedAt != null);
        var latest = requests.OrderByDescending(r => r.CreatedAt).FirstOrDefault();
        var code = record.Code ?? $"rumour-{record.ReferenceNumber}";
        var title = await database.Incidents.Where(i => i.Id == record.IncidentId).Select(i => i.Designation).SingleAsync(cancellationToken);
        return new(record.Id, "record", code, title,
            record.AccessPolicy == AccessPolicy.Public || approved ? record.Markdown : null,
            record.AccessPolicy == AccessPolicy.Sealed ? "sealed" : "public",
            approved ? "approved" : latest?.Status.ToString().ToLowerInvariant(), []);
    }

    public async Task<string?> RequestAccessAsync(string code, Guid viewer, CancellationToken cancellationToken = default)
    {
        var canonical = SearchCode.Parse(code)?.Canonical;
        var rumourNumber = code.StartsWith("rumour-", StringComparison.Ordinal) && long.TryParse(code.AsSpan(7), out var number) && number >= 0 ? number : (long?)null;
        if (canonical is null && rumourNumber is null) return null;
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        // Serialize duplicate requests without changing the established access-request schema.
        var requestKey = canonical ?? $"rumour-{rumourNumber}";
        var lockKey = $"archive-access:{requestKey}:{viewer}";
        await database.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0))", cancellationToken);
        var record = await VisibleRecords.SingleOrDefaultAsync(r => ((canonical != null && r.Code == canonical) || (rumourNumber != null && r.RecordType == RecordType.Rumour && r.ReferenceNumber == rumourNumber)) && r.AccessPolicy == AccessPolicy.Sealed, cancellationToken);
        if (record is null) return null;
        var existing = await database.RecordAccessRequests.AsNoTracking().Where(r => r.RecordId == record.Id && r.RequesterId == viewer)
            .OrderByDescending(r => r.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        var status = existing?.Status.ToString().ToLowerInvariant() ?? "pending";
        if (existing is null)
        {
            database.RecordAccessRequests.Add(new RecordAccessRequest { Id = Guid.CreateVersion7(), RecordId = record.Id, RequesterId = viewer, CreatedAt = DateTimeOffset.UtcNow });
            await database.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return status;
    }
}
