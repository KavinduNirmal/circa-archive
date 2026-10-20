# Services

Infrastructure services for the Auth module that implement cross-cutting and inter-module contracts.

## Structure

- `UserDirectory.cs` — Implements `IUserDirectory` to allow other modules to query user summaries without coupling to EF Core or internal tables.
- `SessionService.cs` — Implements `ISessionService` managing 7-day server-side sessions, SHA-256 rotating refresh tokens, 30-second idempotent grace windows, and replay reuse detection.
- `AccessTokenService.cs` — Implements `IAccessTokenService` issuing 10-minute HS256 JWT access tokens containing identity, role, and session version claims.

## Boundaries

- Provides read-only user summary projection to satisfy cross-module author resolutions.

Session creation records successful sign-in time and a valid connection IP on the
account in the same save as the new session. Manual logout records the account's
last logout time. Refresh and cookie-session lookup check current account access
state; refresh does not add IP history entries or count as a new login.
