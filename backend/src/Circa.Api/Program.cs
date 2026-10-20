using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Asp.Versioning;
using Asp.Versioning.Builder;
using Circa.Auth.Contracts;
using Circa.Auth.Infrastructure;
using Circa.Auth.Infrastructure.Endpoints;
using Circa.Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthModule(builder.Configuration, builder.Environment);
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
