using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Circa.Auth.Infrastructure.Security;

public sealed class OriginValidationMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private readonly string[] _allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var isMutation = !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method);
        if (isMutation && context.Request.Headers.TryGetValue("Origin", out var origins) &&
            !_allowedOrigins.Any(origin => !string.IsNullOrWhiteSpace(origin) &&
                string.Equals(origin, origins.ToString(), StringComparison.OrdinalIgnoreCase)))
        {
            await Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden",
                detail: "Origin is not allowed.",
                extensions: new Dictionary<string, object?> { ["code"] = "origin_mismatch" }).ExecuteAsync(context);
            return;
        }
        await next(context);
    }
}
