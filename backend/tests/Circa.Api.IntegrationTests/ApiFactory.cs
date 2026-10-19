using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Circa.Api.IntegrationTests;

public class ApiFactory : WebApplicationFactory<Program>
{
    public PostgresFixture? PostgresFixture { get; set; }

    public const string TestIssuer = "https://circa.test";
    public const string TestAudience = "circa-test-api";
    public const string TestSigningKey = "ThisIsATestSecretKeyForCircaAuth1234567890=";

    public ApiFactory()
    {
        ClientOptions.AllowAutoRedirect = false;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Auth:Issuer"] = TestIssuer,
                ["Auth:Audience"] = TestAudience,
                ["Auth:SigningKey"] = TestSigningKey,
                ["Auth:AccessTokenLifetimeSeconds"] = "600",
                ["Auth:SessionLifetimeDays"] = "7",
                ["Auth:RefreshGraceSeconds"] = "30",
                ["Auth:RequireSecureCookies"] = "false"
            };

            if (PostgresFixture is not null)
            {
                inMemoryConfig["ConnectionStrings:Auth"] = PostgresFixture.ConnectionString;
            }

            config.AddInMemoryCollection(inMemoryConfig);
        });
    }
}
