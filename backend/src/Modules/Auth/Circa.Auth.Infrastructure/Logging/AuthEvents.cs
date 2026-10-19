using Microsoft.Extensions.Logging;

namespace Circa.Auth.Infrastructure.Logging;

public static class AuthEvents
{
    public static readonly EventId LoginSuccess = new(1001, nameof(LoginSuccess));
    public static readonly EventId LoginFailure = new(1002, nameof(LoginFailure));
    public static readonly EventId RefreshSuccess = new(1003, nameof(RefreshSuccess));
    public static readonly EventId RefreshReuseDetected = new(1004, nameof(RefreshReuseDetected));
    public static readonly EventId Logout = new(1005, nameof(Logout));
    public static readonly EventId SessionRevoked = new(1006, nameof(SessionRevoked));
}
