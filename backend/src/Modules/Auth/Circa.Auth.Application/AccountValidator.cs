using System.Net.Mail;
using Circa.Auth.Domain;
using Circa.Auth.Application.Blocklists;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Circa.Auth.Application;

public sealed class UsernamePolicyOptions
{
    // Baseline only. Deployment owners must curate this list for their languages and moderation policy.
    public string[] BlockedTerms { get; set; } = ["fuck", "shit", "cunt", "nigger"];
}

public sealed class AccountValidator(IOptions<UsernamePolicyOptions> options) : IUserValidator<AppUser>
{
    public Task<IdentityResult> ValidateAsync(UserManager<AppUser> manager, AppUser user)
    {
        var errors = new List<IdentityError>();
        var name = user.UserName ?? "";
        if (name.Length is < 3 or > 20 || name.Any(c => !char.IsAsciiLetterOrDigit(c) && c != '_'))
            errors.Add(new IdentityError { Code = "InvalidUserName", Description = "Username must contain 3–20 ASCII letters, digits or underscores." });
        if (UsernameBlocklist.IsReserved(name) || options.Value.BlockedTerms.Any(term => !string.IsNullOrWhiteSpace(term) && name.Contains(term, StringComparison.OrdinalIgnoreCase)))
            errors.Add(new IdentityError { Code = "BlockedUserName", Description = "Choose a different username." });
        if (!MailAddress.TryCreate(user.Email, out var email) || email.Address != user.Email)
            errors.Add(new IdentityError { Code = "InvalidEmail", Description = "Invalid email address format." });
        return Task.FromResult(errors.Count == 0 ? IdentityResult.Success : IdentityResult.Failed(errors.ToArray()));
    }
}
