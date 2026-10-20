# Endpoints

HTTP route mappings for authentication and session endpoints.

## Structure

- `AuthEndpoints.cs` — Defines Minimal API endpoint routes under `/api/v1/auth` including registration, login, session inspection, and token rotation.

## Boundaries

- Maps inbound HTTP requests to Application command handlers.
- Manages cookie setting and removal without leaking token payloads to the JSON body.

Session inspection and deletion authenticate with the refresh cookie; deletion is restricted to the session owner. `/me` requires a valid JWT and live server session. Logout is idempotent and clears credentials even after expiry.

## Analyst profiles

`GET /api/v1/auth/display-name` returns `{ displayName }`; repeat to reroll before
sign-up (30 previews/minute per IP, separate from registration limits).
`POST /api/v1/auth/register` accepts optional `displayName`; omitted names are
generated, and supplied names must match the predefined vocabulary. Existing
registration response fields are unchanged. `GET /api/v1/auth/me` adds `displayId`,
`displayName`, `displayEmail` and nullable `adoptedOrganizationId` to its existing
fields. It never returns real email, password hashes, IP history or moderation
state. Inactive, banned and soft-deleted accounts receive 401 for protected auth
routes; temporary archive restrictions return 403 for existing access sessions
and prevent fresh login/refresh. Public archive routes remain anonymous.
