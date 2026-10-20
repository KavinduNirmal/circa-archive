using System.Security.Cryptography;
using System.Text;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Logging;
using Circa.Auth.Infrastructure.Options;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Circa.Auth.Infrastructure.Services;

public enum SessionRefreshStatus
{
    Success,
    NotFound,
    ExpiredOrRevoked,
    ReuseDetected
}

public sealed record SessionRefreshResult(
    SessionRefreshStatus Status,
    Session? Session = null,
    string? ReplacementToken = null)
{
    public bool Succeeded => Status == SessionRefreshStatus.Success;
    public static SessionRefreshResult SucceededResult(Session session, string token) =>
        new(SessionRefreshStatus.Success, session, token);
    public static SessionRefreshResult FailedResult(SessionRefreshStatus status) =>
        new(status);
}

public sealed record SessionSummaryDto(Guid Id, DateTimeOffset CreatedAt, DateTimeOffset LastUsedAt, bool Current);

public interface ISessionService
{
    Task<(Session Session, string RawRefreshToken)> CreateSessionAsync(
        Guid userId,
        DateTimeOffset now,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);

    Task<SessionRefreshResult> RefreshAsync(
        string rawRefreshToken,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<Session?> FindSessionByRawTokenAsync(
        string rawRefreshToken,
        CancellationToken ct = default);

    Task RevokeSessionAsync(
        Guid sessionId,
        DateTimeOffset now,
        string reason = "manual_logout",
        CancellationToken ct = default);

    Task<IReadOnlyList<SessionSummaryDto>> GetUserSessionsAsync(
        Guid userId,
        Guid? currentSessionId = null,
        CancellationToken ct = default);
}

public sealed class SessionService : ISessionService
{
    private readonly AuthDbContext _context;
    private readonly IDataProtector _protector;
    private readonly AuthOptions _options;
    private readonly ILogger<SessionService> _logger;
    private readonly IAuthEventLogger _eventLogger;

    public SessionService(
        AuthDbContext context,
        IDataProtectionProvider dataProtectionProvider,
        IOptions<AuthOptions> options,
        ILogger<SessionService> logger,
        IAuthEventLogger eventLogger)
    {
        _context = context;
        _protector = dataProtectionProvider.CreateProtector("Circa.Auth.RefreshTokens");
        _options = options.Value;
        _logger = logger;
        _eventLogger = eventLogger;
    }

    public static string GenerateRawToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    }

    public static byte[] HashToken(string rawToken)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
    }

    public async Task<(Session Session, string RawRefreshToken)> CreateSessionAsync(
        Guid userId,
        DateTimeOffset now,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default)
    {
        var rawToken = GenerateRawToken();
        var tokenHash = HashToken(rawToken);

        var session = Session.Create(
            userId,
            tokenHash,
            now,
            _options.SessionLifetime,
            ipAddress,
            userAgent);

        var user = await _context.Users.FindAsync([userId], cancellationToken: ct)
            ?? throw new InvalidOperationException("Account not found.");
        if (!user.CanAccessArchive(now)) throw new InvalidOperationException("Account cannot access the archive.");
        user.RecordLogin(now, ipAddress);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync(ct);

        return (session, rawToken);
    }

    public async Task<SessionRefreshResult> RefreshAsync(
        string rawRefreshToken,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return SessionRefreshResult.FailedResult(SessionRefreshStatus.NotFound);
        }

        var hash = HashToken(rawRefreshToken);

        await using var tx = await _context.Database.BeginTransactionAsync(ct);

        // 1. Check current refresh_token_hash with FOR UPDATE lock
        var session = await _context.Sessions
            .FromSqlInterpolated($"SELECT * FROM auth.sessions WHERE refresh_token_hash = {hash} FOR UPDATE")
            .FirstOrDefaultAsync(ct);

        if (session is not null)
        {
            if (session.IsLive(now) && await CanUseSessionAsync(session, now, ct))
            {
                var replacementRaw = GenerateRawToken();
                var replacementHash = HashToken(replacementRaw);
                var replacementCiphertext = _protector.Protect(Encoding.UTF8.GetBytes(replacementRaw));

                session.Rotate(replacementHash, replacementCiphertext, now, _options.RefreshGrace);
                await _context.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                return SessionRefreshResult.SucceededResult(session, replacementRaw);
            }

            // Expired or already revoked
            await tx.RollbackAsync(ct);
            return SessionRefreshResult.FailedResult(SessionRefreshStatus.ExpiredOrRevoked);
        }

        // 2. Check previous_token_hash with FOR UPDATE lock
        session = await _context.Sessions
            .FromSqlInterpolated($"SELECT * FROM auth.sessions WHERE previous_token_hash = {hash} FOR UPDATE")
            .FirstOrDefaultAsync(ct);

        if (session is not null)
        {
            if (!await CanUseSessionAsync(session, now, ct))
            {
                await tx.RollbackAsync(ct);
                return SessionRefreshResult.FailedResult(SessionRefreshStatus.ExpiredOrRevoked);
            }

            if (session.IsLive(now) && session.PreviousGraceUntil.HasValue && now < session.PreviousGraceUntil.Value)
            {
                // Idempotent retry within grace window: return same replacement token
                var rawReplacement = Encoding.UTF8.GetString(_protector.Unprotect(session.ReplacementTokenCiphertext!));
                await tx.CommitAsync(ct);
                return SessionRefreshResult.SucceededResult(session, rawReplacement);
            }

            // Replay detected: revoke the session immediately
            session.Revoke(now, "refresh_reuse");
            await _context.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            _logger.LogWarning("Refresh token reuse detected for session {SessionId}. Session revoked.", session.Id);
            _eventLogger.LogRefreshReuseDetected(session.Id, session.CreatedIp?.ToString());
            _eventLogger.LogSessionRevoked(session.Id, "refresh_reuse");
            return SessionRefreshResult.FailedResult(SessionRefreshStatus.ReuseDetected);
        }

        await tx.RollbackAsync(ct);
        return SessionRefreshResult.FailedResult(SessionRefreshStatus.NotFound);
    }

    public async Task<Session?> FindSessionByRawTokenAsync(
        string rawRefreshToken,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return null;
        var hash = HashToken(rawRefreshToken);
        var now = DateTimeOffset.UtcNow;
        var session = await _context.Sessions.AsNoTracking().FirstOrDefaultAsync(s =>
            s.RefreshTokenHash == hash || (s.PreviousTokenHash == hash && s.PreviousGraceUntil > now), ct);
        return session is not null && await CanUseSessionAsync(session, now, ct) ? session : null;
    }

    private async Task<bool> CanUseSessionAsync(Session session, DateTimeOffset now, CancellationToken ct)
    {
        var user = await _context.Users.FindAsync([session.UserId], cancellationToken: ct);
        return user is not null && user.CanAccessArchive(now);
    }

    public async Task RevokeSessionAsync(
        Guid sessionId,
        DateTimeOffset now,
        string reason = "manual_logout",
        CancellationToken ct = default)
    {
        var session = await _context.Sessions.FindAsync([sessionId], cancellationToken: ct);
        if (session is not null && session.RevokedAt is null)
        {
            session.Revoke(now, reason);
            if (reason == "manual_logout")
            {
                var user = await _context.Users.FindAsync([session.UserId], cancellationToken: ct);
                user?.RecordLogout(now);
            }
            await _context.SaveChangesAsync(ct);
            _eventLogger.LogSessionRevoked(sessionId, reason);
        }
    }

    public async Task<IReadOnlyList<SessionSummaryDto>> GetUserSessionsAsync(
        Guid userId,
        Guid? currentSessionId = null,
        CancellationToken ct = default)
    {
        var sessions = await _context.Sessions
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .OrderByDescending(s => s.LastUsedAt)
            .ToListAsync(ct);

        return sessions
            .Select(s => new SessionSummaryDto(s.Id, s.CreatedAt, s.LastUsedAt, s.Id == currentSessionId))
            .ToList();
    }
}
