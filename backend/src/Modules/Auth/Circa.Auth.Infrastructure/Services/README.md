# Services

Infrastructure services for the Auth module that implement cross-cutting and inter-module contracts.

## Structure

- `UserDirectory.cs` — Implements `IUserDirectory` to allow other modules to query user summaries without coupling to EF Core or internal tables.
- `SessionService.cs` — Implements `ISessionService` managing 7-day server-side sessions, SHA-256 rotating refresh tokens, 30-second idempotent grace windows, and replay reuse detection.

## Boundaries

- Provides read-only user summary projection to satisfy cross-module author resolutions.
