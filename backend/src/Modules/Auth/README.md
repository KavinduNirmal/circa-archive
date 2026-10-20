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

## User model decisions

`Circa.Auth.Domain.AppUser` is the single account model, extending ASP.NET Core
Identity; shared modules use `IUserDirectory` rather than a second common user.
`Id` is UUIDv7 for new accounts, and `Role` retains the existing lowercase
`author` contract (the proposed user type). A unique nine-digit `DisplayId` and
non-unique generated `DisplayName` are cosmetic. Display email is derived as
`{DisplayId}@my.circa.archive` and never authenticates a user.

Organization adoption is shared cosmetic flair, not unique per user. Its nullable
UUID stores a future organization reference; null represents `my.circa.archive`.
This follows the repository's stable-ID rule instead of storing a display code.
Organization lookup and adoption endpoints await the organization module.

Registration permits ASCII letters, digits and underscores, 3–20 characters,
case-insensitive unique username/email, and an eight-character password containing
uppercase, lowercase, digit and symbol. A configurable username blocklist provides
a baseline profanity filter; it is not comprehensive multilingual moderation.
Display-name previews can be rerolled before registration; accepted names must
come from the server's predefined vocabulary. Existing registration clients may
omit the name and receive a generated one.

Inactive, banned and soft-deleted accounts cannot authenticate or use sessions.
Temporary restrictions block archive access until expiry. Five strikes ban an
account. Login/logout timestamps and the ten most recent distinct login IPs are
private account data. Administrative lifecycle operations are domain methods;
admin HTTP tooling and permanent erasure of authored content remain unimplemented.
