using Circa.Archive.Application;
using Circa.Archive.Domain;
using Circa.Archive.Infrastructure.Persistence;
using Circa.Archive.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Record = Circa.Archive.Domain.Record;

namespace Circa.Modules.Archive.Tests;

public sealed class SearchReaderTests(ArchivePostgresFixture fixture, Xunit.Abstractions.ITestOutputHelper output) : IClassFixture<ArchivePostgresFixture>
{
    private static readonly Guid Owner = Guid.NewGuid();
    private static readonly Guid Approved = Guid.NewGuid();
    private static readonly Guid Pending = Guid.NewGuid();

    private async Task<ArchiveDbContext> SeedAsync()
    {
        var db = fixture.CreateContext();
        await db.Database.ExecuteSqlRawAsync("TRUNCATE archive.organizations, archive.incidents, archive.characters, archive.recoveries CASCADE");
        var date = new DateTimeOffset(2004, 9, 12, 0, 0, 0, TimeSpan.Zero);
        var publicIncident = new Incident { Id = Guid.NewGuid(), ReferenceNumber = 8000, Designation = "The Unwalled Door", Markdown = "Walking through spectral gardens. 한국어 비밀정원", AuthorId = Owner, ContentHash = "a", CreatedAt = date, UpdatedAt = date, HolderCode = "CIRCA-A-09876", WarningTier = WarningTier.Yellow, WarningDisclosure = WarningDisclosure.None, WarningTags = ["psychological-horror"] };
        db.Incidents.Add(publicIncident);
        foreach (var (number, access, lifecycle) in new[] { (8001, AccessPolicy.Sealed, RecordStatus.OnFile), (8002, AccessPolicy.Restricted, RecordStatus.OnFile), (8003, AccessPolicy.Public, RecordStatus.Erased), (8004, AccessPolicy.Public, RecordStatus.Tombstoned) })
            db.Incidents.Add(new Incident { Id = Guid.NewGuid(), ReferenceNumber = number, Designation = "Withheld incident", Markdown = "obsidianvault 별빛금고", AccessPolicy = access, RecordStatus = lifecycle, WarningTier = number == 8001 ? WarningTier.Red : null, AuthorId = Owner, ContentHash = "b", CreatedAt = date, UpdatedAt = date });
        for (var n = 0; n < 8; n++)
        {
            var record = new Record { Id = Guid.NewGuid(), RecordType = n == 2 ? RecordType.Rumour : n == 1 ? RecordType.Evidence : RecordType.Exploration,
                ReferenceNumber = 300000 + n, Code = n == 2 ? null : $"{(n == 1 ? "EVI" : "EXP")}-{300000 + n}", Incident = publicIncident, AuthorId = Owner,
                Markdown = n == 3 ? "recordsecret 달빛금고" : "A spectral garden report", ContentHash = "c", CreatedAt = date.AddDays(n), UpdatedAt = date,
                AccessPolicy = n == 3 ? AccessPolicy.Sealed : n == 4 ? AccessPolicy.Restricted : AccessPolicy.Public,
                RecordStatus = n == 5 ? RecordStatus.Erased : RecordStatus.OnFile,
                HolderCode = "HOLDER-123", WarningTier = n == 1 ? WarningTier.Red : WarningTier.Green, WarningDisclosure = WarningDisclosure.NoWarningsApply };
            db.Records.Add(record);
            if (n == 6) db.Tombstones.Add(new Tombstone { Id = Guid.NewGuid(), Record = record, Reason = "removed", Category = "spam", Hash = "x", TombstonedBy = Owner, TombstonedAt = date });
            if (n is 0 or 3 or 7)
                for (var vote = 0; vote < (n == 7 ? 9 : 10); vote++)
                    db.RecordAssessments.Add(new RecordAssessment { Id = Guid.NewGuid(), Record = record, UserId = Guid.NewGuid(), Assessment = vote < 7 ? AssessmentValue.Contest : AssessmentValue.Corroborate, CreatedAt = date });
            if (n == 3)
            {
                db.RecordAccessRequests.Add(new RecordAccessRequest { Id = Guid.NewGuid(), Record = record, RequesterId = Approved, Status = AccessRequestStatus.Approved, DecidedAt = date, CreatedAt = date });
                db.RecordAccessRequests.Add(new RecordAccessRequest { Id = Guid.NewGuid(), Record = record, RequesterId = Pending, Status = AccessRequestStatus.Pending, CreatedAt = date });
            }
        }
        db.Organizations.Add(new Organization { Id = Guid.NewGuid(), ReferenceNumber = 6000, Name = "The Quiet Office", LegacyCode = "ORG-A-081323", Markdown = "Spectral gardeners", FiledById = Owner, FiledAt = date, CreatedAt = date, UpdatedAt = date });
        db.Organizations.Add(new Organization { Id = Guid.NewGuid(), ReferenceNumber = 6001, Name = "Erased office", RecordStatus = RecordStatus.Erased, FiledAt = date, CreatedAt = date });
        db.Characters.Add(new Character { Id = Guid.NewGuid(), ReferenceNumber = 19000, Name = "Mara Vale", Markdown = "A spectral archivist", CreatedAt = date, UpdatedAt = date });
        db.Recoveries.Add(new Recovery { Id = Guid.NewGuid(), ReferenceNumber = 1, Name = "Glass key", AlternativeNames = ["Moon latch"], Description = "Spectral equipment", CreatedAt = date, UpdatedAt = date });
        await db.SaveChangesAsync();
        return db;
    }

    private static SearchRequest Request(params (string Key, string Value)[] values)
    {
        var result = SearchRequestValidator.Parse(values.GroupBy(x => x.Key).ToDictionary(g => g.Key, g => g.Select(x => x.Value).ToArray()));
        return Assert.IsType<SearchRequest>(result.Request);
    }

    [Fact]
    public async Task SearchesAllFiveShapesAndHidesWithdrawnRowsBeforeCounting()
    {
        await using var db = await SeedAsync();
        var response = await new SearchReader(db).SearchAsync(Request());
        Assert.Equal(10, response.Page.Total);
        Assert.Equal(5, response.Items.Select(x => x.Type).Distinct().Count());
        Assert.DoesNotContain(response.Items, x => x.Access == "restricted" || x.Lifecycle != "on_file");
        Assert.Equal(2, response.Items.Count(x => x.Redacted));
        Assert.All(response.Items.Where(x => x.Redacted), x => { Assert.Null(x.Excerpt); Assert.Empty(x.Highlights); });
        Assert.DoesNotContain(response.Facets["status"], x => x.Value is "erased" or "restricted" or "tombstoned");
        Assert.Equal(1, response.Items.Count(x => x.Status == "contested"));
        var rumour = Assert.Single(response.Items, x => x.Class == "rumour");
        Assert.Null(rumour.Code);
        Assert.Equal("RUM", rumour.DisplayCode);
        Assert.NotNull(rumour.Parent);
    }

    [Theory]
    [InlineData("obsidianvault", "en")]
    [InlineData("별빛금고", "ko")]
    [InlineData("recordsecret", "en")]
    [InlineData("달빛금고", "ko")]
    public async Task SealedBodiesCannotMatchForGuestOwnerOrPendingReader(string query, string language)
    {
        await using var db = await SeedAsync();
        foreach (var viewer in new Guid?[] { null, Owner, Pending })
        {
            var response = await new SearchReader(db).SearchAsync(Request(("q", query), ("language", language)), viewer);
            Assert.Empty(response.Items);
            Assert.Equal(0, response.Page.Total);
            Assert.All(response.Facets.Values, values => Assert.Empty(values));
        }
    }

    [Fact]
    public async Task OnlyApprovedDatedRecordAccessUnlocksSearchBody()
    {
        await using var db = await SeedAsync();
        var reader = new SearchReader(db);
        var response = await reader.SearchAsync(Request(("q", "recordsecret")), Approved);
        var item = Assert.Single(response.Items);
        Assert.False(item.Redacted);
        Assert.Contains("recordsecret", item.Excerpt);
        Assert.Equal("sealed", item.Status);
        Assert.Empty((await reader.SearchAsync(Request(("q", "obsidianvault")), Approved)).Items);
        await db.Database.ExecuteSqlRawAsync("UPDATE archive.record_access_requests SET decided_at = NULL");
        Assert.Empty((await reader.SearchAsync(Request(("q", "recordsecret")), Approved)).Items);
    }

    [Theory]
    [InlineData("type", "organization", 1)]
    [InlineData("type", "character", 1)]
    [InlineData("type", "recovery", 1)]
    [InlineData("type", "record", 5)]
    [InlineData("class", "rumour", 1)]
    [InlineData("class", "exploration", 3)]
    [InlineData("status", "on-file", 7)]
    [InlineData("status", "restricted", 0)]
    [InlineData("status", "erased", 0)]
    [InlineData("status", "tombstoned", 0)]
    [InlineData("lifecycle", "on-file", 10)]
    [InlineData("lifecycle", "erased", 0)]
    [InlineData("access", "sealed", 2)]
    [InlineData("advisory", "none", 8)]
    [InlineData("warn", "red", 2)]
    [InlineData("warn", "green", 4)]
    [InlineData("disclosure", "not-provided", 1)]
    [InlineData("disclosure", "no-warnings-apply", 5)]
    [InlineData("class", "evidence", 1)]
    [InlineData("status", "contested", 1)]
    [InlineData("status", "sealed", 2)]
    [InlineData("access", "restricted", 0)]
    [InlineData("advisory", "contested", 2)]
    [InlineData("warn", "yellow", 1)]
    [InlineData("disclosure", "none", 1)]
    [InlineData("warnTag", "psychological-horror", 1)]
    [InlineData("holder", "circa-a", 1)]
    [InlineData("holder", "The Quiet Office", 0)]
    [InlineData("holder", "ORG-A-081323", 0)]
    [InlineData("period", "recent", 0)]
    [InlineData("from", "2004-09-19", 1)]
    [InlineData("to", "2004-09-11", 0)]
    public async Task AppliesEveryFilter(string key, string value, int expected)
    {
        await using var db = await SeedAsync();
        Assert.Equal(expected, (await new SearchReader(db).SearchAsync(Request((key, value)))).Page.Total);
    }

    [Fact]
    public async Task MatchesEnglishStemmingKoreanVocabularyCodesAndSafeInput()
    {
        await using var db = await SeedAsync();
        var reader = new SearchReader(db);
        Assert.NotEmpty((await reader.SearchAsync(Request(("q", "walk")))).Items);
        Assert.Single((await reader.SearchAsync(Request(("q", "비밀정원"), ("language", "ko")))).Items);
        Assert.Equal(2, (await reader.SearchAsync(Request(("q", "봉인됨"), ("language", "ko")))).Page.Total);
        var exact = await reader.SearchAsync(Request(("q", "inc-008000")));
        Assert.Equal("exact", exact.Meta.CodeMatch);
        Assert.Equal("incident", exact.Items[0].Type);
        Assert.Equal("exact", (await reader.SearchAsync(Request(("q", "ORG-A-081323")))).Meta.CodeMatch);
        Assert.Equal("reserved", (await reader.SearchAsync(Request(("q", "INC-000001")))).Meta.CodeMatch);
        Assert.Equal("missing", (await reader.SearchAsync(Request(("q", "INC-008003")))).Meta.CodeMatch);
        Assert.Empty((await reader.SearchAsync(Request(("q", "'; DROP TABLE records; --")))).Items);
    }

    [Fact]
    public async Task CombinesFacetsAndPaginatesGloballyWithTotalsOnEmptyPages()
    {
        await using var db = await SeedAsync();
        var reader = new SearchReader(db);
        Assert.Equal(2, (await reader.SearchAsync(Request(("type", "incident"), ("type", "organization"), ("access", "public")))).Page.Total);
        Assert.Empty((await reader.SearchAsync(Request(("warnTag", "psychological-horror"), ("excludeWarnTag", "psychological-horror"), ("type", "incident"), ("warn", "yellow")))).Items);
        var response = await reader.SearchAsync(Request(("page", "50")));
        Assert.Empty(response.Items);
        Assert.Equal(10, response.Page.Total);
        Assert.Equal(1, response.Page.TotalPages);
        Assert.Equal("exact", (await reader.SearchAsync(Request(("holder", "CIRCA-A-09876")))).Meta.HolderMatch);
        Assert.Equal("prefix", (await reader.SearchAsync(Request(("holder", "CIRCA")))).Meta.HolderMatch);
    }
    [Theory]
    [InlineData(9, 9, false)]
    [InlineData(10, 7, true)]
    [InlineData(100, 69, false)]
    [InlineData(100, 70, true)]
    public async Task ContestedRequiresQuorumAndSeventyPercent(int count, int contests, bool contested)
    {
        await using var db = await SeedAsync();
        var record = await db.Records.SingleAsync(x => x.Code == "EXP-300007");
        await db.RecordAssessments.Where(x => x.RecordId == record.Id).ExecuteDeleteAsync();
        for (var n = 0; n < count; n++)
            db.RecordAssessments.Add(new RecordAssessment { Id = Guid.NewGuid(), RecordId = record.Id,
                UserId = Guid.NewGuid(), Assessment = n < contests ? AssessmentValue.Contest : AssessmentValue.Corroborate });
        await db.SaveChangesAsync();
        var result = await new SearchReader(db).SearchAsync(Request(("q", record.Code!)));
        Assert.Equal(contested ? "contested" : "on-file", Assert.Single(result.Items, x => x.Id == record.Id).Status);
    }

    [Fact]
    public async Task SearchesAlternativeNamesAndEscapesLiteralWildcardCharacters()
    {
        await using var db = await SeedAsync();
        var reader = new SearchReader(db);
        Assert.Equal("recovery", Assert.Single((await reader.SearchAsync(Request(("q", "Moon latch")))).Items).Type);
        Assert.Empty((await reader.SearchAsync(Request(("q", "%_")))).Items);
        Assert.Empty((await reader.SearchAsync(Request(("holder", "%")))).Items);
    }

    [Fact]
    public async Task SortsGloballyAndKeepsFacetsIndependentOfSelectedGroups()
    {
        await using var db = await SeedAsync();
        var reader = new SearchReader(db);
        var newest = await reader.SearchAsync(Request(("sort", "newest")));
        Assert.Equal(newest.Items.OrderByDescending(x => x.FiledAt).ThenByDescending(x => x.Id), newest.Items);
        var oldest = await reader.SearchAsync(Request(("sort", "oldest")));
        Assert.Equal(oldest.Items.OrderBy(x => x.FiledAt).ThenBy(x => x.Id), oldest.Items);
        var title = await reader.SearchAsync(Request(("sort", "title")));
        Assert.Equal(title.Items.OrderBy(x => x.Title.ToLowerInvariant(), StringComparer.Ordinal).ThenBy(x => x.Id), title.Items);
        var filtered = await reader.SearchAsync(Request(("type", "organization")));
        Assert.Single(filtered.Items);
        Assert.Equal(5, filtered.Facets["type"].Length);
        Assert.Equal(10, filtered.Facets["type"].Sum(x => x.Count));
    }

    [Fact]
    public async Task MeasuresRepresentativeQueriesOverTenThousandDocuments()
    {
        await using var db = await SeedAsync();
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO archive.incidents (id, reference_number, severity, designation, markdown, author_id, content_hash,
                holder_code, warning_tier, created_at, updated_at)
            SELECT md5('search-benchmark-' || n)::uuid, 1000000 + n, 'E', 'Benchmark garden ' || n,
                'The spectral garden opens at night. 한국어 비밀정원', '00000000-0000-0000-0000-000000000001'::uuid,
                'benchmark', 'BENCH-' || n, 'yellow', '2004-01-01'::timestamptz, '2004-01-01'::timestamptz
            FROM generate_series(1, 10000) n;
            ANALYZE archive.incidents;
            """);
        var requests = new (string Name, SearchRequest Request)[]
        {
            ("exact-code", Request(("q", "INC-1000001"))),
            ("english-body", Request(("q", "spectral"))),
            ("korean-body", Request(("q", "비밀정원"), ("language", "ko"))),
            ("sealed-only", Request(("q", "obsidianvault"))),
            ("combined", Request(("type", "incident"), ("status", "on-file"), ("warn", "yellow"), ("holder", "BENCH-1"))),
            ("page-1", Request()),
            ("page-50", Request(("page", "50")))
        };
        var reader = new SearchReader(db);
        foreach (var (name, request) in requests)
        {
            await reader.SearchAsync(request);
            var times = new List<double>();
            for (var run = 0; run < 10; run++)
            {
                var watch = System.Diagnostics.Stopwatch.StartNew();
                await reader.SearchAsync(request);
                times.Add(watch.Elapsed.TotalMilliseconds);
            }
            times.Sort();
            var p95 = times[(int)Math.Ceiling(times.Count * 0.95) - 1];
            output.WriteLine($"{name}: p95 {p95:F1} ms, 10,010 visible documents, 10 measured requests after warmup");
            Assert.True(p95 < 750, $"{name} p95 {p95:F1} ms exceeds the 750 ms regression ceiling.");
        }
    }

}
