# Authentication transport

## Responsibility and structure

- `client.ts`: `authFetch` for same-origin `/api/*` browser calls, a single shared refresh for concurrent 401s, then one retry with the original body. It skips credential endpoints and never retries 403. A failed refresh or retry with 401 throws `SignedOutError` (`code: signed_out`) for the caller to translate. Network errors and non-401 refresh failures remain operational failures; 429 does not sign out.
- `session.ts`: server-only `sessionFetch` and `getSession`, forwarding inbound cookies to the trusted API origin with `no-store`. Server Components can read account data but cannot set cookies.
- `navigation.ts`: refresh scheduling for page requests and cookie propagation to both the browser response and current Server Component request. JWT expiry is an untrusted scheduling hint; all authentication and authorization stays in the API.
- `server.ts`: validates the server-only `API_ORIGIN` deployment setting, never derived from the incoming Host header.

## Boundaries

The browser never reads, serializes, or stores credentials. The API sets HttpOnly cookies. Next's proxy resolves locale first and refreshes only when a refresh cookie exists and access is missing, malformed, or within 120 seconds of expiry. API requests remain outside the proxy matcher. Public navigation survives refresh outages; it grants no authenticated access.

Refresh cookies use `Path=/` so they reach page navigations. They retain `HttpOnly; SameSite=Strict` and production `Secure`. This deliberately changes the earlier `/api/v1/auth` path: a path-scoped cookie cannot reach the Next proxy. This pre-release change requires clearing any legacy local auth cookies and signing in again. Both application servers are trusted to receive credentials under the one-origin topology.

## Usage and verification

Import `authFetch` only in browser code; import `getSession` or `sessionFetch` only in server code. Callers render translated account/sign-in states; this phase adds transport, while existing archive/workstation data stays on fixtures. No new account UI is introduced.

Set `API_ORIGIN` to the internal API origin. Development and tests default to `http://localhost:5040`; production requires an explicit value for server auth. Local Next rewrites `/api/*` to that origin in development. Production routing must send `/api` directly to the API through the shared reverse proxy. Set the API `AllowedOrigins` to the public website origin.

From `client/`, run `bun run test -- tests/auth-client.test.ts tests/auth-proxy.test.ts tests/auth-session.test.ts tests/i18n-routing.test.ts` and `bun run test:e2e:auth` (Docker, .NET 10, and Chromium required). The latter starts an isolated PostgreSQL/API and a separate Next development server on port 3101, using `.next/auth-e2e` to coexist with the normal development server. Tests simulate access-cookie expiry without wall-clock waiting.
