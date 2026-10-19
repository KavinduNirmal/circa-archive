using Circa.Auth.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Circa.Auth.Infrastructure.Persistence;

public class AuthDbContext : IdentityUserContext<AppUser, Guid>
{
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
            b.Property(u => u.Role).HasMaxLength(20).IsRequired().HasDefaultValue("author");
            b.Property(u => u.CreatedAt).IsRequired();
            b.Property(u => u.StrikeCount).HasDefaultValue(0);
        });

        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
    }
}
