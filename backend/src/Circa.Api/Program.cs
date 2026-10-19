using Asp.Versioning;
using Asp.Versioning.Builder;
using Circa.Auth.Contracts;
using Circa.Auth.Infrastructure;
using Circa.Auth.Infrastructure.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthModule(builder.Configuration, builder.Environment);
builder.Services.AddProblemDetails();

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

var app = builder.Build();

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
