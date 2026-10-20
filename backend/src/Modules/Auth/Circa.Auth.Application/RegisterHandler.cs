using Circa.Auth.Domain;
using Microsoft.AspNetCore.Identity;

namespace Circa.Auth.Application;

public sealed class RegisterHandler
{
    private readonly UserManager<AppUser> _userManager;

    public RegisterHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<AuthResult<RegisterResponse>> HandleAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.ValidationFailed, "All fields are required.");
        }

        if (request.Password.Length < 8)
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.ValidationFailed, "Password must be at least 8 characters long.");
        }

        if (!System.Net.Mail.MailAddress.TryCreate(request.Email, out var email) || email.Address != request.Email)
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.ValidationFailed, "Invalid email address format.");
        }

        var existingUserByName = await _userManager.FindByNameAsync(request.Username);
        if (existingUserByName is not null)
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.UsernameTaken, "Username is already taken.");
        }

        var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail is not null)
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.EmailTaken, "Email is already taken.");
        }

        if (request.DisplayName is not null && !AnalystName.IsValid(request.DisplayName))
        {
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.ValidationFailed, "Choose a generated analyst name.");
        }

        var user = AppUser.Create(request.Username, request.Email, "author", displayName: request.DisplayName);
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "DuplicateUserName"))
            {
                return AuthResult<RegisterResponse>.Failure(AuthFailureReason.UsernameTaken, "Username is already taken.");
            }
            if (result.Errors.Any(e => e.Code == "DuplicateEmail"))
            {
                return AuthResult<RegisterResponse>.Failure(AuthFailureReason.EmailTaken, "Email is already taken.");
            }
            return AuthResult<RegisterResponse>.Failure(AuthFailureReason.ValidationFailed, string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        return AuthResult<RegisterResponse>.Success(new RegisterResponse(user.Id, user.UserName!, user.Role));
    }
}
