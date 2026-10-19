# Services

Infrastructure services for the Auth module that implement cross-cutting and inter-module contracts.

## Structure

- `UserDirectory.cs` — Implements `IUserDirectory` to allow other modules to query user summaries without coupling to EF Core or internal tables.

## Boundaries

- Provides read-only user summary projection to satisfy cross-module author resolutions.
