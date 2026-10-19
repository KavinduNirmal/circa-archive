using Asp.Versioning;
using Asp.Versioning.Builder;
using Circa.Auth.Infrastructure;
using Circa.Auth.Infrastructure.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthModule(builder.Configuration, builder.Environment);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

var app = builder.Build();

ApiVersionSet versionSet = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1, 0))
    .ReportApiVersions()
    .Build();

var api = app.MapGroup("/api/v{version:apiVersion}")
    .WithApiVersionSet(versionSet);

api.MapGet("/", () => "CIRCA API").HasApiVersion(1, 0);
api.MapAuthEndpoints();

app.Run();

public partial class Program { }
