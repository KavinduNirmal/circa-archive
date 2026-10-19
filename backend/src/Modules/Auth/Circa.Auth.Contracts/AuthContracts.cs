using Circa.Common.Application;
using Microsoft.AspNetCore.Authorization;

namespace Circa.Auth.Contracts;

public sealed record UserSummary(Guid Id, string Username, string Role, bool CanPost);

public interface IUserDirectory
{
    Task<UserSummary?> FindAsync(UserId id, CancellationToken ct = default);
    Task<IReadOnlyDictionary<UserId, UserSummary>> FindManyAsync(
        IReadOnlyCollection<UserId> ids, CancellationToken ct = default);
}

public static class AuthPolicies
{
    public const string Writes = "writes";
    public const string Moderator = "moderator";
    public const string Votes = "votes";
}

public sealed record LiveSessionRequirement : IAuthorizationRequirement;
public sealed record CanPostRequirement : IAuthorizationRequirement;
public sealed record StaffCannotRateRequirement : IAuthorizationRequirement;
