using Circa.Auth.Infrastructure;
using Circa.Auth.Infrastructure.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthModule(builder.Configuration, builder.Environment);

var app = builder.Build();

app.MapGet("/", () => "Hello World!");
app.MapAuthEndpoints();

app.Run();

public partial class Program { }
