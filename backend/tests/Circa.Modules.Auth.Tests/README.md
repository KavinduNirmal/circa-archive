# Circa.Modules.Auth.Tests

## Responsibility

Validates domain invariants, use case handlers, cryptographic token generation, and session rotation algorithms for the Auth module in isolation.

## Structure

`AppUserTests.cs` covers identity defaults, lifecycle restrictions, five-strike bans, analyst names and bounded login history. `AccountValidatorTests.cs` covers username/email boundaries, upstream reserved names independently of profanity settings, and exact matching without blocking longer names. Uses `xunit`. References `Circa.Auth.Domain`, `Circa.Auth.Application`, `Circa.Auth.Infrastructure`, and `Circa.Auth.Contracts`.

## Boundaries

Focuses on module behavior without requiring a full HTTP server host. Verifies business logic, time expiration rules, and edge cases.

## Usage

Run Auth module tests:

```sh
dotnet test tests/Circa.Modules.Auth.Tests
```
