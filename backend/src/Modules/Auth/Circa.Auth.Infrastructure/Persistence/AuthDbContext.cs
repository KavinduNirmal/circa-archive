using Circa.Auth.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Circa.Auth.Infrastructure.Persistence;

public class AuthDbContext : IdentityUserContext<AppUser, Guid>
{
    public DbSet<Session> Sessions => Set<Session>();

    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("auth");

        builder.Entity<AppUser>(b =>
        {
            b.ToTable("users");
            b.Property(u => u.Id).HasColumnName("id");
            b.Property(u => u.UserName).HasColumnName("username");
            b.Property(u => u.NormalizedUserName).HasColumnName("normalized_username");
            b.Property(u => u.Email).HasColumnName("email");
            b.Property(u => u.NormalizedEmail).HasColumnName("normalized_email");
            b.Property(u => u.EmailConfirmed).HasColumnName("email_confirmed");
            b.Property(u => u.PasswordHash).HasColumnName("password_hash");
            b.Property(u => u.SecurityStamp).HasColumnName("security_stamp");
            b.Property(u => u.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            b.Property(u => u.PhoneNumber).HasColumnName("phone_number");
            b.Property(u => u.PhoneNumberConfirmed).HasColumnName("phone_number_confirmed");
            b.Property(u => u.TwoFactorEnabled).HasColumnName("two_factor_enabled");
            b.Property(u => u.LockoutEnd).HasColumnName("lockout_end");
            b.Property(u => u.LockoutEnabled).HasColumnName("lockout_enabled");
            b.Property(u => u.AccessFailedCount).HasColumnName("access_failed_count");
            b.Property(u => u.Role).HasColumnName("role").HasMaxLength(20).IsRequired().HasDefaultValue("author");
            b.Property(u => u.DisplayId).HasColumnName("display_id").HasMaxLength(9).IsRequired();
            b.HasIndex(u => u.DisplayId).IsUnique().HasDatabaseName("ux_users_display_id");
            b.HasIndex(u => u.NormalizedEmail).IsUnique().HasDatabaseName("EmailIndex");
            b.Property(u => u.DisplayName).HasColumnName("display_name").HasMaxLength(64).IsRequired();
            b.Property(u => u.AdoptedOrganizationId).HasColumnName("adopted_organization_id");
            b.Ignore(u => u.DisplayEmail);
            b.Ignore(u => u.ActivityIPList);
            b.Property<List<string>>("_activityIPList").HasColumnName("activity_ip_list").HasColumnType("text[]");
            b.Property(u => u.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            b.Property(u => u.IsBanned).HasColumnName("is_banned");
            b.Property(u => u.DeletedAt).HasColumnName("deleted_at");
            b.Property(u => u.UpdatedAt).HasColumnName("updated_at");
            b.Property(u => u.LastLoginAt).HasColumnName("last_login_at");
            b.Property(u => u.LastLogoutAt).HasColumnName("last_logout_at");
            b.Property(u => u.CreatedAt).HasColumnName("created_at").IsRequired();
            b.Property(u => u.StrikeCount).HasColumnName("strike_count").HasDefaultValue(0);
            b.Property(u => u.LastStrikeAt).HasColumnName("last_strike_at");
            b.Property(u => u.RestrictedUntil).HasColumnName("restricted_until");
        });

        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        builder.Entity<Session>(b =>
        {
            b.ToTable("sessions");
            b.HasKey(s => s.Id);
            b.Property(s => s.Id).HasColumnName("id");
            b.Property(s => s.UserId).HasColumnName("user_id").IsRequired();
            b.Property(s => s.RefreshTokenHash).HasColumnName("refresh_token_hash").IsRequired();
            b.Property(s => s.PreviousTokenHash).HasColumnName("previous_token_hash");
            b.Property(s => s.PreviousGraceUntil).HasColumnName("previous_grace_until");
            b.Property(s => s.ReplacementTokenCiphertext).HasColumnName("replacement_token_ciphertext");
            b.Property(s => s.TokenVersion).HasColumnName("token_version").HasDefaultValue(1);
            b.Property(s => s.CreatedAt).HasColumnName("created_at").IsRequired();
            b.Property(s => s.LastUsedAt).HasColumnName("last_used_at").IsRequired();
            b.Property(s => s.ExpiresAt).HasColumnName("expires_at").IsRequired();
            b.Property(s => s.RevokedAt).HasColumnName("revoked_at");
            b.Property(s => s.RevokedReason).HasColumnName("revoked_reason").HasMaxLength(100);
            b.Property(s => s.CreatedIp).HasColumnName("created_ip");
            b.Property(s => s.UserAgent).HasColumnName("user_agent");

            b.HasIndex(s => s.RefreshTokenHash).IsUnique().HasDatabaseName("ux_sessions_current_token");
            b.HasIndex(s => s.UserId).HasDatabaseName("ix_sessions_user_active");
            b.HasIndex(s => s.PreviousTokenHash).HasDatabaseName("ix_sessions_previous_token");

            b.HasOne<AppUser>()
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
