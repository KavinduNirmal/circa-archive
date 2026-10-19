using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("pgvector/pgvector:pg16")
        .WithDatabase("circa_test")
        .WithUsername("circa_test")
        .WithPassword("circa_test_password")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<Circa.Auth.Infrastructure.Persistence.AuthDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        await using var context = new Circa.Auth.Infrastructure.Persistence.AuthDbContext(options);
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}
