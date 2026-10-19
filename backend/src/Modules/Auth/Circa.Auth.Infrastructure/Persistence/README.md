# Persistence

The persistence layer for the Auth module manages database configuration, schemas, and EF Core contexts.

## Structure

- `AuthDbContext.cs` — EF Core context inheriting from `IdentityUserContext<AppUser, Guid>`, mapped to the `auth` schema.

## Boundaries

- Owns the `auth` database schema (`auth.users`, `auth.user_claims`, etc.).
- Never references other module schemas or entities.
