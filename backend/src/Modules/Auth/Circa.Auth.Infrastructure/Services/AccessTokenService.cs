using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Circa.Auth.Domain;
using Circa.Auth.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Circa.Auth.Infrastructure.Services;

public interface IAccessTokenService
{
    string Issue(AppUser user, Session session, DateTimeOffset now);
}

public sealed class AccessTokenService : IAccessTokenService
{
    private readonly AuthOptions _options;

    public AccessTokenService(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public string Issue(AppUser user, Session session, DateTimeOffset now)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("sub", user.Id.ToString()),
            new("name", user.UserName ?? string.Empty),
            new("role", user.Role),
            new("sid", session.Id.ToString()),
            new("ver", session.TokenVersion.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var iat = now.UtcDateTime;
        var nbf = now.UtcDateTime;
        var exp = now.Add(_options.AccessTokenLifetime).UtcDateTime;

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            IssuedAt = iat,
            NotBefore = nbf,
            Expires = exp,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler
        {
            SetDefaultTimesOnTokenCreation = false
        };

        var token = handler.CreateToken(descriptor);
        return handler.WriteToken(token);
    }
}
