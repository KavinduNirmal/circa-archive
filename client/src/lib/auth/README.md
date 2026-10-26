# Authentication transport

## Responsibility and structure

- `transport.ts`: Axios fetch adapter with a fixed API-origin boundary, no automatic redirects, raw response bodies, and Web Response compatibility.
- `forwarded-address.ts`: accepts a single valid IP from an explicitly trusted edge; trust defaults off.
- `client.ts`: `authFetch` uses Axios request/response interceptors for same-origin `/api/*` browser calls, cookie credentials and removal of browser-supplied IP claims, a single shared refresh for concurrent 401s, then one retry with the original body. It skips credential endpoints and never retries 403. A failed refresh or retry with 401 throws `SignedOutError` (`code: signed_out`) for the caller to translate. Network errors and non-401 refresh failures remain operational failures; 429 does not sign out.
- `session.ts`: the public `Account` contract (including analyst display identity and nullable adopted organization UUID), server-only `sessionFetch` and `getSession`. Per-request Axios auth/IP interceptors forward inbound cookies and trusted edge addresses to the trusted API origin with `no-store`. Server Components can read account data but cannot set cookies. Account lookup skips anonymous visitors, uses a five-second timeout, and is memoized per request with React cache. `getSessionState` distinguishes authenticated, guest, and unavailable states while preserving framework rendering signals. A surviving refresh cookie without access means navigation could not complete refresh; it produces an unavailable state, not a guest redirect.
- `navigation.ts`: refresh scheduling for page requests and cookie propagation to both the browser response and current Server Component request. JWT expiry is an untrusted scheduling hint; all authentication and authorization stays in the API.
- `server.ts`: validates the server-only `API_ORIGIN` deployment setting, never derived from the incoming Host header.

## Boundaries

Browser JavaScript never reads or persists tokens. The API sets HttpOnly cookies. Account forms submit entered credentials to the same-origin API and retain them only in the current form while it is open. Next's proxy resolves locale first and refreshes only when a refresh cookie exists and access is missing, malformed, or within 120 seconds of expiry. API requests remain outside the proxy matcher. Public navigation survives refresh outages; it grants no authenticated access.

Refresh cookies use `Path=/` so they reach page navigations. They retain `HttpOnly; SameSite=Strict` and production `Secure`. This deliberately changes the earlier `/api/v1/auth` path: a path-scoped cookie cannot reach the Next proxy. This pre-release change requires clearing any legacy local auth cookies and signing in again. Both application servers are trusted to receive credentials under the one-origin topology.

## Usage and verification

Import `authFetch` only in browser code; import `getSession` or `sessionFetch` only in server code. The [personal access UI](../../components/auth/README.md) uses these helpers for sign-up, sign-in, account details, and the portal/archive access links. Workstation data stays on fixtures. Public archive search and its destinations can use the server API with `SEARCH_SOURCE=api`.

Set `API_ORIGIN` to the internal API origin. Development and tests default to `http://localhost:5040`; production requires an explicit value for server auth. Local Next rewrites `/api/*` to that origin in development. Production routing must send `/api` directly to the API through the shared reverse proxy. The local Compose ingress now provides that topology too. Set the API `AllowedOrigins` to the public website origin.

From `client/`, run `bun run test -- tests/auth-client.test.ts tests/auth-proxy.test.ts tests/auth-session.test.ts tests/i18n-routing.test.ts` and `bun run test:e2e:auth` (Docker, .NET 10, and Chromium required). The latter starts an isolated PostgreSQL/API and a separate Next development server on port 3101, using `.next/auth-e2e` to coexist with the normal development server. Tests simulate access-cookie expiry without wall-clock waiting.

For the root [local Compose stack](../../../../README.md#run-locally-with-docker),
`API_ORIGIN` is `http://circa-api:8080` inside the frontend container. The API is
published at `http://localhost:5040` for a host-run frontend. Browser requests stay
on the website origin; the Docker hostname is server-only.

## Trusted visitor IPs

The browser never discovers or asserts a public IP. The [ingress](../../../../infra/README.md)
overwrites forwarding headers from its socket. Next's server-side Axios IP
interceptor forwards one validated address only with `TRUST_PROXY_HEADERS=true`;
navigation refresh uses the same validation. The API trusts only configured
`ReverseProxy:KnownProxies`, before auth and rate limits. Compose keeps the Next
port private and gives gateway/Next fixed addresses on a separate ingress network.
Leave frontend proxy-header trust unset for a directly exposed Next development
server. External deployments must overwrite headers at ingress and restrict
backend/Next access to configured trusted peers. Never clear trust lists to
accept every sender. No browser IP lookup service or token storage is introduced.
