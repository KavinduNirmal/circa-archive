using System.Text.Json;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;

namespace Circa.Auth.Infrastructure.Security;

public sealed class AuthRateLimitPartitionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ISessionService sessions)
    {
        var policy = context.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
        if (HttpMethods.IsPost(context.Request.Method))
        {
            if (policy == "login_limit" && context.Request.HasJsonContentType())
            {
                context.Request.EnableBuffering(bufferThreshold: 32768, bufferLimit: 32768);
                try
                {
                    using var document = await JsonDocument.ParseAsync(context.Request.Body,
                        cancellationToken: context.RequestAborted);
                    if (document.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        // Match ASP.NET's case-insensitive JSON binding and last-property-wins rule.
                        foreach (var property in document.RootElement.EnumerateObject())
                            if (property.Name.Equals("identifier", StringComparison.OrdinalIgnoreCase))
                                context.Items["Auth_RateLimit_Identifier"] = property.Value.ValueKind == JsonValueKind.String
                                    ? property.Value.GetString()!.ToUpperInvariant() : "";
                    }
                }
                catch (JsonException) { /* Endpoint binding returns the malformed-JSON response. */ }
                catch (IOException)
                {
                    context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                    return;
                }
                finally { context.Request.Body.Position = 0; }
            }
            else if (policy == "refresh_limit" &&
                context.Request.Cookies.TryGetValue(AuthEndpoints.RefreshTokenCookieName, out var token))
            {
                var session = await sessions.FindSessionByRawTokenAsync(token, context.RequestAborted);
                if (session is not null) context.Items["Auth_RateLimit_Session"] = session.Id.ToString();
            }
        }
        await next(context);
    }
}
