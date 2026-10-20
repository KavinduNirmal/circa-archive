# Circa.Auth.Application

## Responsibility

Orchestrates authentication use cases: user registration, credential verification, session management, and refresh token validation algorithms.

## Structure

References `Circa.Auth.Domain` and `Circa.Common.Application`. Contains `RegisterHandler`, `LoginHandler`, request/result contracts, and the Identity `AccountValidator`. Username policy enforces 3–20 ASCII letters/digits/underscores and configurable blocked terms; email validation rejects display-name address forms. Registration accepts an optional server-generated analyst name. Login rejects unavailable account states. Password hashing remains in Identity.

## Boundaries

Coordinates domain entities and application services. Does not depend directly on database implementations, HTTP controllers, or web contexts.

## Usage and verification

Configure `Auth:UsernamePolicy:BlockedTerms` (an array) to curate baseline username
moderation. The default English substring list is deliberately small and can
produce false positives; it does not guarantee detection of offensive names in
all languages or obfuscations. Run `dotnet test backend/Circa.sln` from the root.
