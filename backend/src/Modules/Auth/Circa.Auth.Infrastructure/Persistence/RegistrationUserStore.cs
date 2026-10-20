using Circa.Auth.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Circa.Auth.Infrastructure.Persistence;

// Database constraints arbitrate concurrent registrations; preflight checks alone cannot ensure uniqueness.
public sealed class RegistrationUserStore(AuthDbContext context) : UserOnlyStore<AppUser, AuthDbContext, Guid>(context)
{
    public override async Task<IdentityResult> CreateAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            try
            {
                return await base.CreateAsync(user, cancellationToken);
            }
            catch (DbUpdateException error) when (error.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } conflict)
            {
                if (conflict.ConstraintName == "ux_users_display_id" && attempt < 9)
                {
                    user.RegenerateDisplayId();
                    continue;
                }
                Context.Entry(user).State = EntityState.Detached;
                var result = conflict.ConstraintName switch
                {
                    "UserNameIndex" => IdentityResult.Failed(ErrorDescriber.DuplicateUserName(user.UserName!)),
                    "EmailIndex" => IdentityResult.Failed(ErrorDescriber.DuplicateEmail(user.Email!)),
                    "ux_users_display_id" => IdentityResult.Failed(new IdentityError { Code = "DisplayIdUnavailable", Description = "Unable to allocate an analyst ID. Please retry." }),
                    _ => null
                };
                if (result is null) throw;
                return result;
            }
        }
        throw new InvalidOperationException("Registration retry limit exceeded.");
    }
}
