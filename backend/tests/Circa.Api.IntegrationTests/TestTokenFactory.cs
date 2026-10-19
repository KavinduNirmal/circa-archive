using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Circa.Api.IntegrationTests;

public static class TestTokenFactory
{
    public static string CreateToken(
        Guid userId,
        string username,
        string role = "author",
        Guid? sessionId = null,
        int tokenVersion = 1,
        DateTime? expiresAt = null,
        DateTime? notBefore = null,
        string signingKey = ApiFactory.TestSigningKey,
        string issuer = ApiFactory.TestIssuer,
        string audience = ApiFactory.TestAudience)
    {
        var sid = sessionId ?? Guid.NewGuid();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("sub", userId.ToString()),
            new("name", username),
            new("role", role),
            new("sid", sid.ToString()),
            new("ver", tokenVersion.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var iat = DateTime.UtcNow;
        var nbf = notBefore ?? iat;
        var exp = expiresAt ?? iat.AddMinutes(10);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = issuer,
            Audience = audience,
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
