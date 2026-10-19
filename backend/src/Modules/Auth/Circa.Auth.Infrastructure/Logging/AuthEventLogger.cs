using Microsoft.Extensions.Logging;

namespace Circa.Auth.Infrastructure.Logging;

public sealed class AuthEventLogger : IAuthEventLogger
{
    private readonly ILogger<AuthEventLogger> _logger;

    public AuthEventLogger(ILogger<AuthEventLogger> logger)
    {
        _logger = logger;
    }

    public void LogLoginSuccess(Guid userId, string username, string? ip)
    {
        _logger.LogInformation(
            AuthEvents.LoginSuccess,
            "AuthEvent.LoginSuccess: User {UserId} ({Username}) signed in from {IpAddress}",
            userId,
            username,
            ip ?? "unknown");
    }

    public void LogLoginFailure(string identifier, string reason, string? ip)
    {
        _logger.LogWarning(
            AuthEvents.LoginFailure,
            "AuthEvent.LoginFailure: Failed login for {Identifier} from {IpAddress}. Reason: {Reason}",
            identifier,
            ip ?? "unknown",
            reason);
    }

    public void LogRefreshSuccess(Guid sessionId, Guid userId)
    {
        _logger.LogInformation(
            AuthEvents.RefreshSuccess,
            "AuthEvent.RefreshSuccess: Refreshed token for session {SessionId}, user {UserId}",
            sessionId,
            userId);
    }

    public void LogRefreshReuseDetected(Guid sessionId, string? ip)
    {
        _logger.LogWarning(
            AuthEvents.RefreshReuseDetected,
            "AuthEvent.RefreshReuseDetected: Refresh token reuse detected for session {SessionId} from {IpAddress}",
            sessionId,
            ip ?? "unknown");
    }

    public void LogLogout(Guid sessionId, Guid userId)
    {
        _logger.LogInformation(
            AuthEvents.Logout,
            "AuthEvent.Logout: Session {SessionId} for user {UserId} logged out",
            sessionId,
            userId);
    }

    public void LogSessionRevoked(Guid sessionId, string reason)
    {
        _logger.LogInformation(
            AuthEvents.SessionRevoked,
            "AuthEvent.SessionRevoked: Session {SessionId} revoked. Reason: {Reason}",
            sessionId,
            reason);
    }
}
