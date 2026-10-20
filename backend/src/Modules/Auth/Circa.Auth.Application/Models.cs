namespace Circa.Auth.Application;

public sealed record RegisterRequest(string Username, string Email, string Password, string? DisplayName = null);

public sealed record RegisterResponse(Guid Id, string Username, string Role);

public sealed record LoginRequest(string Identifier, string Password);

public sealed record LoginResponse(Guid Id, string Username, string Role);

public enum AuthFailureReason
{
    ValidationFailed,
    UsernameTaken,
    EmailTaken,
    InvalidCredentials,
    LockedOut
}

public sealed record AuthResult<T>(bool Succeeded, T? Value = default, AuthFailureReason? FailureReason = null, string? ErrorMessage = null)
{
    public static AuthResult<T> Success(T value) => new(true, Value: value);
    public static AuthResult<T> Failure(AuthFailureReason reason, string? message = null) => new(false, FailureReason: reason, ErrorMessage: message);
}
