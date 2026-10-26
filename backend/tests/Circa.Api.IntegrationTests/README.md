# Circa.Api.IntegrationTests

## Responsibility

Validates API routing, middleware, authentication flows, authorization policies, and database integration using real containerized PostgreSQL instances.

## Structure

Uses `WebApplicationFactory<Program>`, `xunit`, and `Testcontainers.PostgreSql`. References `Circa.Api`.

## Boundaries

Exercises the system through the HTTP surface. Asserts response status codes, cookie headers, and database side effects.

## Usage

Run integration tests:

```sh
dotnet test tests/Circa.Api.IntegrationTests
```

`HardeningTests` covers rate-limit boundaries, stable refresh partitions, CSRF origins, credential-free audit logs, security headers, error codes, and session ownership. `ApiFactory.Overrides` adjusts limits for isolated tests (the lockout test allows enough attempts to exercise Identity independently).

## User profiles

`UserProfileTests.cs` covers profile round-trips, private-field exclusion, password
rules, account-state access denial, case-insensitive and concurrent registration,
display-ID collision retries, and reserved-name rejection without account creation or cookies. `UserProfileUpgradeTests.cs` verifies the SQL
upgrade against a separate disposable legacy-shaped database. Docker is required.
Run `dotnet test backend/Circa.sln` from the repository root.

## Local database startup

`DatabaseInitializationTests.cs` starts isolated PostgreSQL databases without the
usual fixture schema creation. It verifies opt-in Development initialization,
default-disabled behavior, data preservation on restart, and rejection outside
Development. `ApiFactory.EnvironmentName` and `PostgresFixture.InitializeSchema`
let these tests exercise real startup without changing other suites' defaults.

`ForwardedAddressTests.cs` checks the IP persisted during real registration:
trusted gateway/Next peers, spoofed and malformed headers, and the one-hop limit.
On constrained systems, run one class at a time from the root:

```sh
DOTNET_PROCESSOR_COUNT=1 DOTNET_CLI_USE_MSBUILD_SERVER=0 MSBUILDDISABLENODEREUSE=1 \
  dotnet test backend/tests/Circa.Api.IntegrationTests \
  --filter FullyQualifiedName~ForwardedAddressTests --maxcpucount:1 --nodeReuse:false
```

Reuse `--no-build --no-restore` for subsequent batches only after a successful
build. Do not run frontend checks or production builds concurrently with these
batches.

## Global search

`SearchEndpointTests` initializes the archive schema and exercises anonymous and
stale-cookie search, validation ProblemDetails, repeated facets, language aliases,
private cache headers, pagination links, rate limits/Retry-After, real database
timeouts, generic unexpected-error responses, and sealed-record access through live/revoked sessions. Moderators and
owners receive stubs unless explicitly approved; revocation falls back to public
results rather than failing the public endpoint.

`ArchiveDestinationEndpointTests` covers private destination responses, stale-cookie
guests, explicit incident acknowledgment, real organization bodies, idempotent
access requests, moderator/owner stubs, approved readers, revoked sessions, and
hidden-parent 404s. Run with `--filter FullyQualifiedName~ArchiveDestination`.

The shared PostgreSQL fixture uses Testcontainers 4.16 and an explicit image
constructor. The unused Respawn dependency (and its vulnerable SQL Server/Azure/Image
transitives) is removed; fixtures already isolate data through disposable PostgreSQL.
Search validation also checks an encoded NUL returns field-level
400 ProblemDetails before database execution.
