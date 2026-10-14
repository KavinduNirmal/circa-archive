# Backend

## Responsibility

Reserved for domain behavior, authorized APIs, persistence, and real-time events.

## Structure and boundaries

No backend project exists yet. The draft specifies .NET 10 Minimal APIs, EF Core, PostgreSQL, and SignalR; see root `ARCHITECTURE.md`. Frontend rendering belongs in `client/`. Keep transport, domain behavior, and persistence responsibilities explicit as modules are introduced.

## Development

Create a test runner before adding executable behavior. Document real restore, build, test, run, and migration commands with the project or solution. Add a README in every new authored folder. Do not store secrets or production data here.
