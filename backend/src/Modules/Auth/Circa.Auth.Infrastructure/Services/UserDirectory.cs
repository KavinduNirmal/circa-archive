using Circa.Auth.Contracts;
using Circa.Auth.Domain;
using Circa.Common.Application;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Circa.Auth.Infrastructure.Services;

public sealed class UserDirectory : IUserDirectory
{
    private readonly UserManager<AppUser> _userManager;

    public UserDirectory(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserSummary?> FindAsync(UserId id, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(id.Value.ToString());
        if (user is null) return null;

        var now = DateTimeOffset.UtcNow;
        return new UserSummary(user.Id, user.UserName ?? string.Empty, user.Role, user.CanPost(now));
    }

    public async Task<IReadOnlyDictionary<UserId, UserSummary>> FindManyAsync(
        IReadOnlyCollection<UserId> ids, CancellationToken ct = default)
    {
        var guidIds = ids.Select(i => i.Value).ToList();
        var now = DateTimeOffset.UtcNow;

        var users = await _userManager.Users
            .Where(u => guidIds.Contains(u.Id))
            .ToListAsync(ct);

        return users.ToDictionary(
            u => new UserId(u.Id),
            u => new UserSummary(u.Id, u.UserName ?? string.Empty, u.Role, u.CanPost(now)));
    }
}
