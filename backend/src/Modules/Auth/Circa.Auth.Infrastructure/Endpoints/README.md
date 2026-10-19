# Endpoints

HTTP route mappings for authentication and session endpoints.

## Structure

- `AuthEndpoints.cs` — Defines Minimal API endpoint routes under `/api/auth` including registration, login, session inspection, and token rotation.

## Boundaries

- Maps inbound HTTP requests to Application command handlers.
- Manages cookie setting and removal without leaking token payloads to the JSON body.
