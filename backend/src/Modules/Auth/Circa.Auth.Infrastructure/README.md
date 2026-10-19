# Circa.Auth.Infrastructure

## Responsibility

Implements persistence and technical capabilities for authentication: `AuthDbContext` (PostgreSQL `auth` schema), token generation, cryptographic hashing, cookie management, and ASP.NET Core authorization requirement handlers.

## Structure

References `Circa.Auth.Application`, `Circa.Auth.Contracts`, and `Circa.Common.Infrastructure`. Contains EF Core entity configurations, schema migrations, token issuers, and service registration extensions (`AddAuthModule`).

## Boundaries

Internal implementation details (such as `AuthDbContext` and table entities) are kept internal to this project and never exposed to other modules. Only `Circa.Api` references this project to wire up DI and endpoints.
