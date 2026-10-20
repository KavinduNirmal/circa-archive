# Circa.Auth.Domain

## Responsibility

Defines the account model, cosmetic analyst identity, session invariants and moderation state.

## Structure

- `AppUser.cs`: single Identity-backed account, UUIDv7 identifiers, nine-digit display
  IDs, profile defaults, lifecycle methods, strikes and bounded login IP history.
  Developer-facing model requirements remain beside the implementation.
- `AnalystName.cs`: predefined name vocabulary, random previews and selection validation.
- `Session.cs`: refresh rotation, expiry and revocation rules.

## Boundaries

Uses the ASP.NET Core Identity framework for inherited credentials and account fields.
Has no database or HTTP dependencies. Password hashing and username/email validation
belong to Identity services; EF mapping belongs to Infrastructure. Organization
adoption stores a nullable stable UUID without depending on an organization entity.
See [module decisions](../README.md#user-model-decisions).

## Usage and verification

Run `dotnet test backend/tests/Circa.Modules.Auth.Tests` from the repository root.
