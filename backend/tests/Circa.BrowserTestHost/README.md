# Browser test API host

## Responsibility and structure

`Program.cs` exposes the real API on port 5041 with an isolated Testcontainers PostgreSQL database. It reuses `ApiFactory` and `PostgresFixture` from the integration suite. The database and host are disposed on shutdown.

## Boundaries

This executable is test infrastructure, never production startup. Test credentials come from the existing test factory. No development database is modified.

## Usage and verification

Requires Docker and .NET 10. `dotnet run --project backend/tests/Circa.BrowserTestHost` starts it; `bun run --cwd=client test:e2e:auth` manages it automatically alongside Next.js. Browser assertions live in `client/e2e/auth.spec.ts`.

`CIRCA_SEARCH_E2E=1` adds `SearchDestinationSeed.cs`: dedicated incidents, a sealed
record, a rumour, an organization, an approved reader, and an unapproved moderator.
It initializes only the disposable database, permits the search frontend on 3102,
and raises the search limit for deterministic integration runs. The search config
waits for the seeded destination before starting tests.
