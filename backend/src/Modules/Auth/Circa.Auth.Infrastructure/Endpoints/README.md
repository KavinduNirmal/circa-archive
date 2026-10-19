# Endpoints

HTTP route mappings for authentication and session endpoints.

## Structure

- `AuthEndpoints.cs` — Defines Minimal API endpoint routes under `/api/v1/auth` including registration, login, session inspection, and token rotation.

## Boundaries

- Maps inbound HTTP requests to Application command handlers.
- Manages cookie setting and removal without leaking token payloads to the JSON body.

Session inspection and deletion authenticate with the refresh cookie; deletion is restricted to the session owner. `/me` requires a valid JWT and live server session. Logout is idempotent and clears credentials even after expiry.
