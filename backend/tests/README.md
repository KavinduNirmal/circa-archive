# Backend Tests

## Responsibility

Hosts unit, integration, and contract tests for the CIRCA backend services.

## Structure

- `Circa.Api.IntegrationTests/`: End-to-end HTTP integration tests utilizing `WebApplicationFactory` and `Testcontainers.PostgreSql`.
- `Circa.BrowserTestHost/`: real Kestrel API and isolated PostgreSQL for the client auth browser suite.
- `Circa.Modules.Auth.Tests/`: Unit and component tests for Auth domain invariants, handlers, and session lifecycle logic.

## Boundaries

Test projects verify behavior against public contracts and endpoint routes without bypassing domain encapsulation. Test utilities reset state between executions.

## Usage

Run all backend tests:

```sh
dotnet test
```
