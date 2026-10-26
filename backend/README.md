# Backend

## Responsibility

Hosts the domain behavior, authorized APIs, persistence, and real-time events for the CIRCA Archive. Built as a .NET 10 modular monolith deploying as a single service host over PostgreSQL.

## Structure and boundaries

```text
backend/
  Circa.sln                   # Solution file
  Directory.Build.props       # Central build properties (net10.0, nullable, warnings-as-errors)
  Directory.Packages.props    # Central package version management (CPM)
  Dockerfile                  # Multistage build and runtime container image
  docker-compose.yml          # Compatibility entry point for the root local Compose stack
  src/                        # Application host, shared cross-cutting layers, and domain modules
  tests/                      # Unit and integration test suites
```

Frontend rendering and browser logic belong in `client/`. The backend exposes HTTP Minimal APIs; SignalR hubs are planned. Domain modules maintain isolated schemas within the single PostgreSQL instance and interact across module boundaries exclusively through contract interfaces and types.

## Implementation status

Authentication is implemented and integrated with the Next.js account pages and
server-rendered session navigation: registration, sign-in, account persistence,
rotating cookie sessions, JWT validation, and authorization policies. The archive
schema now persists incidents, filings, organizations, characters, recoveries,
and tags, with exact, trigram, full-text, composite, and filtered indexes.
The global search read API is implemented across all five entity types.
Archive CRUD, publishing, notes, moderation, and real-time delivery remain in
development; the client still reads fixtures.

## Development

Prerequisites: .NET 10 SDK and Docker.

- Restore dependencies: `dotnet restore`
- Build solution: `dotnet build`
- Run test suites: `dotnet test`
- Start local backing database: configure the root `.env`, then `docker compose up -d circa-db`
- Run local API host: `dotnet run --project src/Circa.Api`
- Run the full app: `docker compose up --build --detach --wait` from the repository root or this folder.

## Authentication hardening

The API uses `/api/v1/auth/*`. Set `Auth:Issuer`, `Auth:Audience`, and `Auth:SigningKey` with development user-secrets (`dotnet user-secrets --project src/Circa.Api set ...`) or production environment variables (`Auth__SigningKey`, etc.). The existing issuer treats the signing key as UTF-8 text containing at least 32 bytes; use a cryptographically random value. No key is stored in tracked settings. Startup rejects a missing/short key, a token lifetime other than 600 seconds, and insecure cookies outside Development.

Configure `AllowedOrigins` with exact browser origins, including the port in development (for example `AllowedOrigins__0=http://localhost:3001`). Supplied origins on unsafe requests are denied unless listed; absent Origin supports server and CLI callers. The host adds restrictive API CSP, `nosniff`, and Referrer-Policy headers. These headers apply to API responses; the website owns its own CSP and Markdown sanitization.

Limits are 5 login attempts per minute per connection IP and normalized identifier, 3 registration attempts per hour per IP, and 30 refreshes per minute per session across rotations. Rejection returns 429 with `code=rate_limit_exceeded` and never revokes a session. Identity lockout remains 10 failed passwords. Limits are process-local; multi-instance deployments need a shared gateway limit. Do not trust arbitrary forwarded IP headers.

Auth audit events record login success/failure, refresh, reuse, logout, and revocation without passwords or credentials. Restrict audit log access and retention; hash IPs before exporting to long-term storage. Error responses use ProblemDetails with stable `code` fields.

To rotate the single signing key, deploy a new random key on every instance together, revoke active `auth.sessions` through an operational database procedure, and require sign-in again. Replacing the JWT signing key alone invalidates access JWTs but does not revoke opaque refresh sessions. Persist Data Protection keys across host restarts for refresh grace retries.

The Next.js integration uses `Path=/` for the Strict, HttpOnly refresh cookie so it reaches page navigations. The previous auth-only path cannot support proxy refresh. Clear pre-release local auth cookies and sign in again after this change. See the [client transport guide](../client/src/lib/auth/README.md).

## Archive persistence

The `archive` schema is created by an idempotent SQL script after the Auth schema
is initialized. It contains models, search indexes, and the supporting tables used by
`GET /api/v1/search`. The client retains fixture search until destination read
pages are integrated. See [Archive module](src/Modules/Archive/README.md) and
[index rationale](src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/README.md).

## Account profiles

The single user model is [`AppUser`](src/Modules/Auth/Circa.Auth.Domain/AppUser.cs)
in the Auth domain; the Common domain does not own account entities. Developer
requirements are retained with the model. See [user model decisions](src/Modules/Auth/README.md#user-model-decisions)
for profile fields and lifecycle rules, and [schema upgrade instructions](src/Modules/Auth/Circa.Auth.Infrastructure/Persistence/README.md#schema-upgrade-and-verification)
before running this version against an existing auth database. No existing schema upgrade runs automatically.

## Local containers

See the root [Docker instructions](../README.md#run-locally-with-docker). The API
listens on container port 8080 and host port 5040; the frontend uses
`http://circa-api:8080` inside Docker and `http://localhost:5040` on the host.
Compose supplies local auth settings, the website origin allowlist, database
connection, and HTTP cookie settings. `Database:InitializeOnStartup=true` creates
a fresh schema only in Development. The option defaults to false and is rejected
outside Development. Existing schemas require the explicit upgrade above.

The Dockerfile restores/publishes the API project and its references without
including test projects. It runs as the image's non-root app user. Separate named
volumes retain PostgreSQL data and Data Protection keys across restarts.

Testcontainers.PostgreSql is pinned centrally to 4.16.0 to remove vulnerable
transitive test dependencies. The unused Respawn reference was removed along with
its vulnerable SQL Server/Azure/Image dependencies. Audit all projects with
`dotnet list Circa.sln package --vulnerable --include-transitive` from this folder;
restore before reusing `--no-restore` test commands after dependency changes.
