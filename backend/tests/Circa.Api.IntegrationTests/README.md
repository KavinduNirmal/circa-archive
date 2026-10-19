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
