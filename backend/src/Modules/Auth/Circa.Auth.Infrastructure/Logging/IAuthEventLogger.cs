namespace Circa.Auth.Infrastructure.Logging;

public interface IAuthEventLogger
{
    void LogLoginSuccess(Guid userId, string username, string? ip);
    void LogLoginFailure(string identifier, string reason, string? ip);
    void LogRefreshSuccess(Guid sessionId, Guid userId);
    void LogRefreshReuseDetected(Guid sessionId, string? ip);
    void LogLogout(Guid sessionId, Guid userId);
    void LogSessionRevoked(Guid sessionId, string reason);
}
