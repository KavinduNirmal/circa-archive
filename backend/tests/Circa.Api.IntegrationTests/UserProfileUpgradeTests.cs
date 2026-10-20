using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Circa.Api.IntegrationTests;

// This fixture owns a separate disposable database; schema changes never touch another test class.
public sealed class UserProfileUpgradeTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Upgrade_PreservesLegacyIdentityAndBackfillsProfiles()
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>().UseNpgsql(postgres.ConnectionString).Options;
        await using var db = new AuthDbContext(options);
        var user = AppUser.Create("legacy_analyst", "legacy@example.com");
        user.PasswordHash = "existing-password-hash";
        db.Users.Add(user);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Reconstruct the former auth.users shape before applying the documented upgrade.
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE auth.users DROP COLUMN display_id, DROP COLUMN display_name,
                DROP COLUMN adopted_organization_id, DROP COLUMN is_active, DROP COLUMN is_banned,
                DROP COLUMN deleted_at, DROP COLUMN updated_at, DROP COLUMN last_login_at,
                DROP COLUMN last_logout_at, DROP COLUMN activity_ip_list;
            DROP INDEX auth."EmailIndex";
            CREATE INDEX "EmailIndex" ON auth.users (normalized_email);
            """);
        var sql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "ExtendUserProfiles.sql"));
        // A fixed repository SQL file contains PostgreSQL array literals, not format placeholders.
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;
        await db.Database.OpenConnectionAsync();
        await command.ExecuteNonQueryAsync();

        var upgraded = (await db.Users.FindAsync(user.Id))!;
        Assert.Equal(user.Id, upgraded.Id);
        Assert.Equal("legacy_analyst", upgraded.UserName);
        Assert.Equal("existing-password-hash", upgraded.PasswordHash);
        Assert.Matches("^[0-9]{9}$", upgraded.DisplayId);
        Assert.True(AnalystName.IsValid(upgraded.DisplayName));
        Assert.True(upgraded.IsActive);
        Assert.Equal(upgraded.CreatedAt, upgraded.UpdatedAt);
        Assert.Empty(upgraded.ActivityIPList);
    }
}
