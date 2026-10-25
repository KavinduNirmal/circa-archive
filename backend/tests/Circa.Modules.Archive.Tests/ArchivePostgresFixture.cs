using Circa.Archive.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace Circa.Modules.Archive.Tests;

public sealed class ArchivePostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("pgvector/pgvector:pg16")
        .WithDatabase("circa_archive_test")
        .WithUsername("circa_archive_test")
        .WithPassword("circa_archive_test_password")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var context = CreateContext();
        await ArchiveSchemaInitializer.EnsureAsync(context);
        await ArchiveSchemaInitializer.EnsureAsync(context);
    }

    public ArchiveDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ArchiveDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new ArchiveDbContext(options);
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}
