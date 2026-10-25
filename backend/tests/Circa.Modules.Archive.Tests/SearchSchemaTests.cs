using Microsoft.EntityFrameworkCore;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchSchemaTests(ArchivePostgresFixture fixture) : IClassFixture<ArchivePostgresFixture>
{
    [Fact]
    public async Task CreatesSearchDependenciesAndGeneratedColumnsIdempotently()
    {
        await using var db = fixture.CreateContext();
        var tables = await db.Database.SqlQueryRaw<string>(
            "SELECT tablename AS \"Value\" FROM pg_tables WHERE schemaname = 'archive'").ToListAsync();
        foreach (var table in new[] { "record_assessments", "record_access_requests", "tombstones" })
            Assert.Contains(table, tables);
        foreach (var table in new[] { "incidents", "records", "organizations", "characters", "recoveries" })
        {
            var columns = await db.Database.SqlQuery<string>($"SELECT column_name AS \"Value\" FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = {table} AND is_generated = 'ALWAYS'").ToListAsync();
            Assert.Contains("search_text", columns);
            Assert.Contains("search_vector", columns);
        }
        var indexes = await db.Database.SqlQueryRaw<string>("SELECT indexname AS \"Value\" FROM pg_indexes WHERE schemaname = 'archive'").ToListAsync();
        foreach (var table in new[] { "incidents", "records", "organizations", "characters", "recoveries" })
        {
            Assert.Contains($"ix_{table}_search_text", indexes);
            Assert.Contains($"ix_{table}_search_vector", indexes);
        }
        Assert.Contains("ix_records_holder_prefix", indexes);
        Assert.Contains("ix_incidents_holder_prefix", indexes);
    }
}
