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
