# Auth Module

## Responsibility

Manages user identity, registration, password hashing, session records, refresh token rotation, JWT access token issuance, and authorization policies.

## Structure

- `Circa.Auth.Domain/`: Core domain entities (`AppUser`, `Session`, moderation strike state) and domain rules.
- `Circa.Auth.Application/`: Use cases and handlers (`RegisterHandler`, `LoginHandler`, session refresh orchestration).
- `Circa.Auth.Infrastructure/`: EF Core `AuthDbContext`, database migrations, token generation services, cookie helpers, and authorization requirement handlers.
- `Circa.Auth.Contracts/`: Public interfaces (`IUserDirectory`), shared identifiers, policy constants, and requirement contracts exposed to other modules.

## Boundaries

The Auth module exclusively manages the `auth` database schema. Other modules resolve user information via `IUserDirectory` and never query `auth.users` directly.
