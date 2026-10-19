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

Frontend rendering and browser logic belong in `client/`. The backend exposes HTTP Minimal APIs and SignalR hubs. Domain modules maintain isolated schemas within the single PostgreSQL instance and interact across module boundaries exclusively through contract interfaces and types.

## Development

Prerequisites: .NET 10 SDK and Docker.

- Restore dependencies: `dotnet restore`
- Build solution: `dotnet build`
- Run test suites: `dotnet test`
- Start local backing database: `docker compose up -d circa-db`
- Run local API host: `dotnet run --project src/Circa.Api`
- Run full container stack: `docker compose --profile full up --build`
