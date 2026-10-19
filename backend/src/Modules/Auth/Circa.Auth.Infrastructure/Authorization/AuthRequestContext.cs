using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Persistence;

namespace Circa.Auth.Infrastructure.Authorization;

public interface IAuthRequestContext
{
    Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<AppUser?> GetUserAsync(Guid userId, CancellationToken ct = default);
}

public sealed class AuthRequestContext : IAuthRequestContext
{
    private readonly AuthDbContext _dbContext;
    private Session? _cachedSession;
    private bool _sessionLoaded;
    private AppUser? _cachedUser;
    private bool _userLoaded;

    public AuthRequestContext(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        if (_sessionLoaded) return _cachedSession;
        _cachedSession = await _dbContext.Sessions.FindAsync([sessionId], cancellationToken: ct);
        _sessionLoaded = true;
        return _cachedSession;
    }

    public async Task<AppUser?> GetUserAsync(Guid userId, CancellationToken ct = default)
    {
        if (_userLoaded) return _cachedUser;
        _cachedUser = await _dbContext.Users.FindAsync([userId], cancellationToken: ct);
        _userLoaded = true;
        return _cachedUser;
    }
}
