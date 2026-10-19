using Circa.Api.IntegrationTests;

// Reuse the real PostgreSQL fixture and API configuration on a browser-accessible socket.
await using var postgres = new PostgresFixture();
await postgres.InitializeAsync();
await using var factory = new ApiFactory
{
    PostgresFixture = postgres,
    ContentRoot = Path.GetFullPath("../../../../../src/Circa.Api", AppContext.BaseDirectory)
};
factory.Overrides["AllowedOrigins:0"] = "http://127.0.0.1:3101";
factory.Overrides["AllowedOrigins:1"] = "http://localhost:3101";
factory.UseKestrel(5041);
factory.StartServer();
using var shutdown = new CancellationTokenSource();
Console.CancelKeyPress += (_, args) => { args.Cancel = true; shutdown.Cancel(); };
using var termination = System.Runtime.InteropServices.PosixSignalRegistration.Create(
    System.Runtime.InteropServices.PosixSignal.SIGTERM, context => { context.Cancel = true; shutdown.Cancel(); });
Console.WriteLine("CIRCA browser test API ready on port 5041");
try { await Task.Delay(Timeout.Infinite, shutdown.Token); }
catch (OperationCanceledException) { }
