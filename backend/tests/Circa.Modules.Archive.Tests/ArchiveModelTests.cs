using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ArchiveRecord = Circa.Archive.Domain.Record;
using Xunit;

namespace Circa.Modules.Archive.Tests;

public sealed class ArchiveModelTests(ArchivePostgresFixture fixture) : IClassFixture<ArchivePostgresFixture>
{
    [Fact]
    public async Task PersistsAllIndexedEntitiesWithDocumentedVocabulary()
    {
        await using var context = fixture.CreateContext();
        var now = DateTimeOffset.UtcNow;

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = 5429,
            Name = "The Quiet Office",
            RecognitionState = RecognitionState.Recognized,
            OrganizationType = OrganizationType.Private,
            FiledById = Guid.NewGuid(),
            FiledAt = now,
            UpdatedAt = now,
            Markdown = "A private body.",
            CreatedAt = now
        };
        context.Organizations.Add(organization);

        var character = new Character
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = 18257,
            Name = "Mara Vale",
            CreatedById = Guid.NewGuid(),
            UsagePolicy = CharacterUsage.Open,
            Markdown = "An archivist.",
            CreatedAt = now,
            UpdatedAt = now
        };
        context.Characters.Add(character);

        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = 7543,
            Severity = IncidentSeverity.S,
            Designation = "The Quiet Office Incident",
            AuthorId = Guid.NewGuid(),
            AuthorAffiliationOrgId = organization.Id,
            ClaimOrgId = organization.Id,
            AccessPolicy = AccessPolicy.Sealed,
            Classification = 5,
            WarningTier = WarningTier.Yellow,
            WarningDisclosure = WarningDisclosure.NoWarningsApply,
            WarningTags = ["Psychological Horror"],
            RecordStatus = RecordStatus.OnFile,
            Markdown = "A sealed incident.",
            ContentHash = new string('c', 64),
            CreatedAt = now,
            UpdatedAt = now
        };
        context.Incidents.Add(incident);

        var record = new ArchiveRecord
        {
            Id = Guid.NewGuid(),
            RecordType = RecordType.Exploration,
            ReferenceNumber = 288902,
            Code = "EXP-288902",
            IncidentId = incident.Id,
            AuthorId = Guid.NewGuid(),
            AuthorAffiliationOrgId = organization.Id,
            AccessPolicy = AccessPolicy.Public,
            WarningDisclosure = WarningDisclosure.None,
            Markdown = "An exploration.",
            ContentHash = new string('d', 64),
            CreatedAt = now,
            UpdatedAt = now,
            Tags = [new RecordTag { Tag = "liminal" }]
        };
        context.Records.Add(record);

        context.Recoveries.Add(new Recovery
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = 1,
            Name = "A brass key",
            AlternativeNames = ["the office key"],
            Category = RecoveryCategory.Object,
            Description = "A key recovered from the site.",
            OriginIncidentId = incident.Id,
            FirstDocumentedRecordId = record.Id,
            RegisteredById = Guid.NewGuid(),
            DocumentationStatus = DocumentationStatus.Documented,
            RegistryStatus = RegistryStatus.Active,
            FirstRecoveredByCharacterId = character.Id,
            FirstRecoveredByOrgId = organization.Id,
            CurrentCustodianCharacterId = character.Id,
            CurrentCustodianOrgId = organization.Id,
            CustodyStatus = CustodyStatus.Claimed,
            Reproducibility = Reproducibility.Unique,
            CreatedAt = now,
            UpdatedAt = now
        });

        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var stored = await context.Incidents.SingleAsync();
        Assert.Equal(AccessPolicy.Sealed, stored.AccessPolicy);
        Assert.Equal(WarningDisclosure.NoWarningsApply, stored.WarningDisclosure);
        Assert.Equal("no_warnings_apply", await VocabularyAsync(context, "incidents", "warning_disclosure"));
        Assert.Equal("EXP", await VocabularyAsync(context, "records", "record_type"));
        Assert.Equal("on_file", await VocabularyAsync(context, "records", "record_status"));
        Assert.Equal("private", await VocabularyAsync(context, "organizations", "organization_type"));

        var fullTextMatches = await context.Database
            .SqlQueryRaw<string>(
                "SELECT designation AS \"Value\" FROM archive.incidents WHERE search_vector @@ websearch_to_tsquery('english', 'sealed incident')")
            .ToListAsync();
        Assert.Single(fullTextMatches);
    }

    private static async Task<string> VocabularyAsync(ArchiveDbContext context, string table, string column)
    {
        var sql = (table, column) switch
        {
            ("incidents", "warning_disclosure") =>
                "SELECT warning_disclosure::text AS \"Value\" FROM archive.incidents LIMIT 1",
            ("records", "record_type") =>
                "SELECT record_type::text AS \"Value\" FROM archive.records LIMIT 1",
            ("records", "record_status") =>
                "SELECT record_status::text AS \"Value\" FROM archive.records LIMIT 1",
            ("organizations", "organization_type") =>
                "SELECT organization_type::text AS \"Value\" FROM archive.organizations LIMIT 1",
            _ => throw new ArgumentOutOfRangeException(nameof(table), table, null)
        };

        return await context.Database.SqlQueryRaw<string>(sql).SingleAsync();
    }
}
