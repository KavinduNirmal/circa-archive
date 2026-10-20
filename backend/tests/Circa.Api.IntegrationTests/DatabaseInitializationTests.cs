using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Circa.Api.IntegrationTests;

public sealed class DatabaseInitializationTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Development_InitializesFreshSchemaOnlyWhenEnabled(bool enabled)
    {
        var postgres = new PostgresFixture { InitializeSchema = false };
        await postgres.InitializeAsync();
        try
        {
            await using var factory = new ApiFactory { PostgresFixture = postgres };
            factory.Overrides["Database:InitializeOnStartup"] = enabled.ToString();
            using var client = factory.CreateClient();
            var options = new DbContextOptionsBuilder<AuthDbContext>().UseNpgsql(postgres.ConnectionString).Options;
            await using var db = new AuthDbContext(options);
            var exists = await db.Database.SqlQueryRaw<bool>("""
                SELECT EXISTS (SELECT FROM information_schema.tables
                    WHERE table_schema = 'auth' AND table_name = 'users') AS "Value"
                """).SingleAsync();

            Assert.Equal(enabled, exists);
            if (enabled)
            {
                // A restart must preserve previously initialized user data.
                var user = Circa.Auth.Domain.AppUser.Create("persisted_analyst", "persisted@example.com");
                db.Users.Add(user);
                await db.SaveChangesAsync();
                await using var restarted = new ApiFactory { PostgresFixture = postgres };
                restarted.Overrides["Database:InitializeOnStartup"] = "true";
                using var restartedClient = restarted.CreateClient();
                Assert.True(await db.Users.AsNoTracking().AnyAsync(u => u.Id == user.Id));
            }
        }
        finally
        {
            await postgres.DisposeAsync();
        }
    }

    [Fact]
    public void Production_RejectsAutomaticSchemaInitialization()
    {
        using var factory = new ApiFactory { EnvironmentName = "Production" };
        factory.Overrides["Database:InitializeOnStartup"] = "true";
        factory.Overrides["Auth:RequireSecureCookies"] = "true";

        var error = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());

        Assert.Contains("Development", error.Message);
    }
}
