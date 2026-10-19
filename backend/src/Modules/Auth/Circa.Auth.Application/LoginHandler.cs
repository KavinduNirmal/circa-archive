using Circa.Auth.Domain;
using Microsoft.AspNetCore.Identity;

namespace Circa.Auth.Application;

public sealed class LoginHandler
{
    private readonly UserManager<AppUser> _userManager;

    public LoginHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<AuthResult<LoginResponse>> HandleAsync(LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return AuthResult<LoginResponse>.Failure(AuthFailureReason.InvalidCredentials, "Invalid credentials.");
        }

        var user = await _userManager.FindByNameAsync(request.Identifier)
                   ?? await _userManager.FindByEmailAsync(request.Identifier);

        if (user is null)
        {
            return AuthResult<LoginResponse>.Failure(AuthFailureReason.InvalidCredentials, "Invalid credentials.");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return AuthResult<LoginResponse>.Failure(AuthFailureReason.LockedOut, "Account is temporarily locked.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            await _userManager.AccessFailedAsync(user);

            if (await _userManager.IsLockedOutAsync(user))
            {
                return AuthResult<LoginResponse>.Failure(AuthFailureReason.LockedOut, "Account is temporarily locked.");
            }

            return AuthResult<LoginResponse>.Failure(AuthFailureReason.InvalidCredentials, "Invalid credentials.");
        }

        await _userManager.ResetAccessFailedCountAsync(user);
        return AuthResult<LoginResponse>.Success(new LoginResponse(user.Id, user.UserName!, user.Role));
    }
}
