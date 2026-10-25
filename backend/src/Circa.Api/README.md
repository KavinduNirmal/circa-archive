# Circa.Api

## Responsibility

Acts as the executable entry point and composition root for the CIRCA backend. Responsible for configuring HTTP pipeline middleware, dependency injection, environment settings, authentication/authorization schemes, and mapping endpoints.

## Structure

- `Program.cs`: Application bootstrap, middleware pipeline, service composition, and route mapping.
- `appsettings.json` and `appsettings.Development.json`: Configuration definitions for logging, database connection strings, and security settings.
- `Properties/launchSettings.json`: Local development launch profiles.

## Boundaries

`Circa.Api` coordinates module registration and exposes their endpoints. It does not implement domain logic, direct database tables, or business rules. It references `Circa.Common.Infrastructure`, module `Infrastructure` projects (to invoke module service extensions), and module `Contracts` projects.

## Usage

Run the web host locally:

```sh
dotnet run --project src/Circa.Api
```

The root [Compose stack](../../../README.md#run-locally-with-docker) supplies local
auth settings and publishes container port 8080 at `localhost:5040`.
`Database:InitializeOnStartup` defaults to false. When true, it creates the current
auth schema in a fresh database before listening. Enabling it outside Development
aborts startup. Existing schemas and data are preserved; `EnsureCreatedAsync`
does not apply upgrades to an existing database.

## Forwarded client addresses

`ReverseProxy:KnownProxies` is an explicit list of literal gateway/server IPs.
Forwarded headers are disabled when it is empty. The middleware processes one
rightmost hop before authentication and rate limiting; it never trusts an
arbitrary caller's IP claim. The Compose ingress replaces inbound forwarding
headers, and Next forwards its validated edge address for server session calls.
See the [ingress guide](../../../infra/README.md). No schema changes are needed.

## Global archive search

`GET /api/v1/search` is public, bounded, and uncached. The host resolves a viewer
through Auth's live-session requirement; revoked, expired, or invalid sessions
fall back to guest visibility. Archive Infrastructure applies approved sealed
record access and search predicates. Configure `Search:PermitLimit` (default 60
requests/minute per connection IP). See [search contract](../Modules/Archive/Circa.Archive.Infrastructure/Search/README.md).
