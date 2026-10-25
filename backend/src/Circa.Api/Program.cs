using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Asp.Versioning;
using Asp.Versioning.Builder;
using Circa.Auth.Contracts;
using Circa.Auth.Infrastructure;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Persistence;
using Circa.Archive.Infrastructure;
using Circa.Archive.Infrastructure.Persistence;
using Circa.Archive.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthModule(builder.Configuration, builder.Environment);
builder.Services.AddArchiveModule(builder.Configuration);
builder.Services.AddProblemDetails();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.KnownProxies.Clear();
    options.KnownIPNetworks.Clear();
    options.ForwardLimit = 1;
    foreach (var address in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
    {
        if (!IPAddress.TryParse(address, out var proxy))
            throw new InvalidOperationException("ReverseProxy:KnownProxies must contain literal IP addresses.");
        options.KnownProxies.Add(proxy);
    }
    // Clearing both trust lists would otherwise trust every peer. No configuration means no forwarding.
    options.ForwardedHeaders = options.KnownProxies.Count == 0
        ? ForwardedHeaders.None
        : ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

var app = builder.Build();

app.UseForwardedHeaders();

if (app.Configuration.GetValue<bool>("Database:InitializeOnStartup"))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Automatic database initialization is only allowed in Development.");
    }

    // Local Compose owns a fresh database. Existing schemas still require an explicit upgrade.
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    await database.Database.EnsureCreatedAsync();

    var archiveDatabase = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
    await ArchiveSchemaInitializer.EnsureAsync(archiveDatabase);
}

app.UseMiddleware<Circa.Auth.Infrastructure.Security.SecurityHeadersMiddleware>();
app.UseMiddleware<Circa.Auth.Infrastructure.Security.OriginValidationMiddleware>();

app.UseMiddleware<Circa.Auth.Infrastructure.Security.AuthRateLimitPartitionMiddleware>();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

ApiVersionSet versionSet = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1, 0))
    .ReportApiVersions()
    .Build();

var api = app.MapGroup("/api/v{version:apiVersion}")
    .WithApiVersionSet(versionSet);

api.MapGet("/", () => "CIRCA API").HasApiVersion(1, 0).AllowAnonymous();
api.MapAuthEndpoints();
api.MapSearchEndpoints(async context =>
{
    if (context.User.Identity?.IsAuthenticated != true) return null;
    var authorization = context.RequestServices.GetRequiredService<IAuthorizationService>();
    var session = await authorization.AuthorizeAsync(context.User, null, [new LiveSessionRequirement()]);
    return session.Succeeded && Guid.TryParse(context.User.FindFirst("sub")?.Value, out var userId) ? userId : (Guid?)null;
}).HasApiVersion(1, 0);

var records = api.MapGroup("/records").HasApiVersion(1, 0);
records.MapGet("/", () => Results.Ok(Array.Empty<object>())).AllowAnonymous();
records.MapPost("/", () => Results.Created("/api/v1/records/1", new { id = 1 }))
    .RequireAuthorization(AuthPolicies.Writes);
records.MapPost("/{id:guid}/vote", (Guid id) => Results.Ok(new { voted = true }))
    .RequireAuthorization(AuthPolicies.Votes);

var moderation = api.MapGroup("/moderation").HasApiVersion(1, 0);
moderation.MapGet("/probe", () => Results.Ok(new { status = "moderation_active" }))
    .RequireAuthorization(AuthPolicies.Moderator);

app.Run();

public partial class Program { }
