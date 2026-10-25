using System.Data.Common;
using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using ArchiveRecord = Circa.Archive.Domain.Record;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Circa.Modules.Archive.Tests;

public sealed class ArchiveSchemaTests(ArchivePostgresFixture fixture) : IClassFixture<ArchivePostgresFixture>
{
    [Fact]
    public async Task CreatesTrigramExtensionAndFuzzyIndexes()
    {
        await using var context = fixture.CreateContext();

        var extensionCount = await context.Database
            .SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM pg_extension WHERE extname = 'pg_trgm'")
            .SingleAsync();

        Assert.Equal(1, extensionCount);
        Assert.Equal("gin", await IndexMethodAsync(context, "ix_incidents_designation_trgm"));
        Assert.Equal("gin", await IndexMethodAsync(context, "ix_organizations_name_trgm"));
        Assert.Equal("gin", await IndexMethodAsync(context, "ix_characters_name_trgm"));
        Assert.Equal("gin", await IndexMethodAsync(context, "ix_recoveries_name_trgm"));
    }

    [Fact]
    public async Task CreatesExactCompositeAndPartialIndexes()
    {
        await using var context = fixture.CreateContext();
        var indexNames = await context.Database
            .SqlQueryRaw<string>("SELECT indexname AS \"Value\" FROM pg_indexes WHERE schemaname = 'archive'")
            .ToListAsync();

        Assert.Contains("ux_incidents_reference_number", indexNames);
        Assert.Contains("ux_organizations_reference_number", indexNames);
        Assert.Contains("ux_records_type_reference_number", indexNames);
        Assert.Contains("ux_records_code", indexNames);
        Assert.Contains("ux_characters_reference_number", indexNames);
        Assert.Contains("ux_recoveries_reference_number", indexNames);
        Assert.Contains("ix_records_recent", indexNames);
        Assert.Contains("ix_records_incident_filings", indexNames);
        Assert.Contains("ix_records_incident_type_filings", indexNames);
        Assert.Contains("ix_records_author_feed", indexNames);
        Assert.Contains("ix_records_affiliation_feed", indexNames);
        Assert.Contains("ix_incidents_feed", indexNames);
        Assert.Contains("ix_organizations_recent", indexNames);
        Assert.Contains("ix_organizations_directory", indexNames);
        Assert.Contains("ix_characters_recent", indexNames);
        Assert.Contains("ix_characters_directory", indexNames);
        Assert.Contains("ix_recoveries_recent", indexNames);
        Assert.Contains("ix_recoveries_directory", indexNames);
        Assert.Contains("ix_recoveries_custody", indexNames);
        Assert.Contains("ix_record_tags_tag_record", indexNames);
        Assert.Contains("ix_incidents_search_vector", indexNames);
        Assert.Contains("ix_records_search_vector", indexNames);

        var filteredIndexCount = await context.Database
            .SqlQueryRaw<int>(
                "SELECT count(*)::int AS \"Value\" FROM pg_indexes WHERE schemaname = 'archive' AND indexdef LIKE '%WHERE%'")
            .SingleAsync();
        Assert.True(filteredIndexCount >= 10);
    }

    [Fact]
    public async Task EnforcesUniqueDisplayCodeAndConsumesRumourReferenceNumbers()
    {
        await using var context = fixture.CreateContext();
        var incident = CreateIncident(7539, "The Silent Signal");
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        context.Records.AddRange(
            CreateRecord(incident.Id, RecordType.Rumour, 1, null, "first rumour"),
            CreateRecord(incident.Id, RecordType.Rumour, 2, null, "second rumour"));
        await context.SaveChangesAsync();

        context.Records.Add(CreateRecord(incident.Id, RecordType.Evidence, 1, "EVI-035783", "first evidence"));
        await context.SaveChangesAsync();

        context.Records.Add(CreateRecord(incident.Id, RecordType.Evidence, 2, "EVI-035783", "duplicate evidence"));
        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    [Fact]
    public async Task UsesTrigramIndexForFuzzyDesignationLookup()
    {
        await using var context = fixture.CreateContext();
        context.Incidents.AddRange(
            CreateIncident(7540, "The Silent Signal"),
            CreateIncident(7541, "Harbour Lights"),
            CreateIncident(7542, "An Empty Orchard"));
        await context.SaveChangesAsync();

        await using var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        await ExecuteAsync(connection, "SET enable_seqscan = off");
        var plan = await ExecuteScalarAsync(
            connection,
            "EXPLAIN (FORMAT TEXT) SELECT id FROM archive.incidents WHERE designation ILIKE '%silent%'");

        Assert.Contains("ix_incidents_designation_trgm", plan);
    }

    private static async Task<string> IndexMethodAsync(ArchiveDbContext context, string indexName)
    {
        return await context.Database
            .SqlQuery<string>(
                $"SELECT am.amname AS \"Value\" FROM pg_class c JOIN pg_am am ON am.oid = c.relam WHERE c.relname = {indexName}")
            .SingleAsync();
    }

    private static async Task ExecuteAsync(DbConnection connection, string sql)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<string> ExecuteScalarAsync(DbConnection connection, string sql)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await using var reader = await command.ExecuteReaderAsync();
        var lines = new List<string>();
        while (await reader.ReadAsync())
        {
            lines.Add(reader.GetString(0));
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static Incident CreateIncident(long referenceNumber, string designation)
    {
        var now = DateTimeOffset.UtcNow;
        return new Incident
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = referenceNumber,
            Severity = IncidentSeverity.A,
            Designation = designation,
            Markdown = $"{designation} filed by the archive.",
            AuthorId = Guid.NewGuid(),
            ContentHash = new string('a', 64),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static ArchiveRecord CreateRecord(
        Guid incidentId,
        RecordType recordType,
        long referenceNumber,
        string? code,
        string markdown)
    {
        var now = DateTimeOffset.UtcNow;
        return new ArchiveRecord
        {
            Id = Guid.NewGuid(),
            RecordType = recordType,
            ReferenceNumber = referenceNumber,
            Code = code,
            IncidentId = incidentId,
            AuthorId = Guid.NewGuid(),
            Markdown = markdown,
            ContentHash = new string('b', 64),
            CreatedAt = now,
            UpdatedAt = now
        };
    }
}
