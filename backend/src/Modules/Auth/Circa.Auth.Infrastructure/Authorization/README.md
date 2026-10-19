# Authorization

Provides authorization requirement handlers, request-level user/session caching, and custom middleware result handling enforcing the CIRCA authorization matrix.

## Responsibility

Evaluates session liveness, user posting restrictions, moderator access, and community voting boundaries for protected endpoints.

## Structure

- `AuthRequestContext.cs` — Scoped per-request cache for `Session` and `AppUser` entities to eliminate redundant database queries across multiple requirements.
- `LiveSessionHandler.cs` — Validates that the session ID and token version in the JWT correspond to an unrevoked, unexpired session in `auth.sessions`.
- `CanPostHandler.cs` — Verifies that the author is not currently restricted due to strikes before writing.
- `StaffCannotRateHandler.cs` — Enforces the rule that staff/moderators never rate or vote.
- `CircaAuthorizationMiddlewareResultHandler.cs` — Intercepts authorization results to map failed `LiveSessionRequirement`s to 401 Unauthorized (the revocation guarantee) while preserving 403 Forbidden for permission failures.

## Boundaries

Handlers evaluate domain rules and contracts defined in `Circa.Auth.Contracts`. Other modules reference authorization policies by string constant (`AuthPolicies.Writes`, `AuthPolicies.Moderator`, `AuthPolicies.Votes`) without depending directly on internal handlers.

## Usage

Registered via `services.AddAuthModule(...)` in `AuthModuleExtensions`. Attached to endpoints using `.RequireAuthorization(AuthPolicies.Writes)` or similar.
