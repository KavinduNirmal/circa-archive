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
  docker-compose.yml          # Local database (PostgreSQL 16) and Redis backing services
  src/                        # Application host, shared cross-cutting layers, and domain modules
  tests/                      # Unit and integration test suites
```

Frontend rendering and browser logic belong in `client/`. The backend exposes HTTP Minimal APIs; SignalR hubs are planned. Domain modules maintain isolated schemas within the single PostgreSQL instance and interact across module boundaries exclusively through contract interfaces and types.

## Implementation status

Authentication is implemented and integrated with the Next.js account pages and
server-rendered session navigation: registration, sign-in, account persistence,
rotating cookie sessions, JWT validation, and authorization policies. Archive
records still come from client fixtures; record persistence, publishing, notes,
moderation, and real-time delivery remain in development.

## Development

Prerequisites: .NET 10 SDK and Docker.

- Restore dependencies: `dotnet restore`
- Build solution: `dotnet build`
- Run test suites: `dotnet test`
- Start local backing database: `docker compose up -d circa-db`
- Run local API host: `dotnet run --project src/Circa.Api`
- Run full container stack: `docker compose --profile full up --build`

## Authentication hardening

The API uses `/api/v1/auth/*`. Set `Auth:Issuer`, `Auth:Audience`, and `Auth:SigningKey` with development user-secrets (`dotnet user-secrets --project src/Circa.Api set ...`) or production environment variables (`Auth__SigningKey`, etc.). The existing issuer treats the signing key as UTF-8 text containing at least 32 bytes; use a cryptographically random value. No key is stored in tracked settings. Startup rejects a missing/short key, a token lifetime other than 600 seconds, and insecure cookies outside Development.

Configure `AllowedOrigins` with exact browser origins, including the port in development (for example `AllowedOrigins__0=http://localhost:3001`). Supplied origins on unsafe requests are denied unless listed; absent Origin supports server and CLI callers. The host adds restrictive API CSP, `nosniff`, and Referrer-Policy headers. These headers apply to API responses; the website owns its own CSP and Markdown sanitization.

Limits are 5 login attempts per minute per connection IP and normalized identifier, 3 registration attempts per hour per IP, and 30 refreshes per minute per session across rotations. Rejection returns 429 with `code=rate_limit_exceeded` and never revokes a session. Identity lockout remains 10 failed passwords. Limits are process-local; multi-instance deployments need a shared gateway limit. Do not trust arbitrary forwarded IP headers.

Auth audit events record login success/failure, refresh, reuse, logout, and revocation without passwords or credentials. Restrict audit log access and retention; hash IPs before exporting to long-term storage. Error responses use ProblemDetails with stable `code` fields.

To rotate the single signing key, deploy a new random key on every instance together, revoke active `auth.sessions` through an operational database procedure, and require sign-in again. Replacing the JWT signing key alone invalidates access JWTs but does not revoke opaque refresh sessions. Persist Data Protection keys across host restarts for refresh grace retries.

The Next.js integration uses `Path=/` for the Strict, HttpOnly refresh cookie so it reaches page navigations. The previous auth-only path cannot support proxy refresh. Clear pre-release local auth cookies and sign in again after this change. See the [client transport guide](../client/src/lib/auth/README.md).
