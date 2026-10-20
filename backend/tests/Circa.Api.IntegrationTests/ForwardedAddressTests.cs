using System.Net;
using System.Text.Json;
using Circa.Auth.Application;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Circa.Api.IntegrationTests;

public sealed class ForwardedAddressTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Theory]
    [InlineData("172.30.0.10", "198.51.100.41", "198.51.100.41")]
    [InlineData("172.30.0.11", "198.51.100.42", "198.51.100.42")]
    [InlineData("203.0.113.4", "198.51.100.41", "203.0.113.4")]
    [InlineData("172.30.0.10", "192.0.2.66, 198.51.100.41", "198.51.100.41")]
    [InlineData("172.30.0.10", "invalid", "172.30.0.10")]
    public async Task Registration_RecordsOnlyAddressesFromConfiguredProxies(string peer, string forwarded, string expected)
    {
        using var factory = new ApiFactory { PostgresFixture = postgres };
        factory.Overrides["ReverseProxy:KnownProxies:0"] = "172.30.0.10";
        factory.Overrides["ReverseProxy:KnownProxies:1"] = "172.30.0.11";
        await AssertRegisteredAddress(factory, peer, forwarded, expected);
    }

    [Fact]
    public async Task DirectApi_DoesNotTrustForwardedHeadersByDefault()
    {
        using var factory = new ApiFactory { PostgresFixture = postgres };
        await AssertRegisteredAddress(factory, "127.0.0.1", "198.51.100.41", "127.0.0.1");
    }

    private sealed class RequestBodyFeature : IHttpRequestBodyDetectionFeature
    {
        public bool CanHaveBody => true;
    }

    private static async Task AssertRegisteredAddress(ApiFactory factory, string peer, string forwarded, string expected)
    {
        _ = factory.CreateClient();
        var username = $"ip_{Guid.NewGuid():N}"[..16];
        var payload = JsonSerializer.SerializeToUtf8Bytes(new RegisterRequest(username, $"{username}@example.com", "Password123!"));
        var response = await factory.Server.SendAsync(context =>
        {
            context.Request.Method = "POST";
            context.Request.Path = "/api/v1/auth/register";
            context.Connection.RemoteIpAddress = IPAddress.Parse(peer);
            context.Request.Headers["X-Forwarded-For"] = forwarded;
            context.Request.ContentType = "application/json";
            context.Request.ContentLength = payload.Length;
            context.Request.Body = new MemoryStream(payload);
            context.Features.Set<IHttpRequestBodyDetectionFeature>(new RequestBodyFeature());
        });
        Assert.Equal((int)HttpStatusCode.Created, response.Response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var user = await database.Users.SingleAsync(user => user.UserName == username);
        Assert.Equal([expected], user.ActivityIPList);
    }
}
