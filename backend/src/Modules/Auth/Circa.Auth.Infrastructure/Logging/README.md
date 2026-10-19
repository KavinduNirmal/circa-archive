# Logging

Structured audit logging for authentication and session lifecycle events.

## Responsibility

Emits strongly-typed `AuthEvent` records for sign-in successes, sign-in failures, token rotations, replay reuse detections, logouts, and revocations. Guarantees that raw token strings and password secrets are never recorded into application logs.

## Structure

- `AuthEvents.cs` — Constant `EventId` definitions categorizing distinct security and lifecycle events.
- `IAuthEventLogger.cs` — Service contract for logging audit events.
- `AuthEventLogger.cs` — Implementation using `Microsoft.Extensions.Logging.ILogger`.

## Boundaries

Used internally by `AuthEndpoints` and `SessionService`. Exposes no sensitive credential material in log messages or scope parameters.

## Usage

Registered as a singleton in `AuthModuleExtensions`. Injected into endpoint delegates and infrastructure services.
