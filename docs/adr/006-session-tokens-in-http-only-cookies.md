# 006: Sessions with short-lived JWTs in HttpOnly cookies

- **Status:** Accepted — implemented
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Implementation update — 2026-10-20

Authentication and Next.js session integration are implemented. The versioned endpoints use `/api/v1/auth/*`; both cookies use `Path=/` so refresh credentials reach page navigations. The original transport decision below records the earlier auth-only refresh path. Current configuration and operational limits are documented in the [backend guide](../../backend/README.md) and [client transport guide](../../client/src/lib/auth/README.md).

The context and decision below are retained as the historical record.

## Context

The product's access rule is simple to state: guests may read the archive, and only signed-in authors may create records, comment (which is filing a record), or vote. Moderators are authors with an additional grant. Organizations are fictional entities, never accounts.

The first backend module must therefore answer three questions well: who is making the request, what may they do to this particular resource, and how does a session end. The draft contract asks for JWT authentication, 7-day sessions, and a short access-token lifetime. The short lifetime came from Clerk, whose session tokens default to 60 seconds and are refreshed on a 50-second interval against a session whose maximum lifetime defaults to 7 days ([Clerk](https://clerk.com/docs/guides/how-clerk-works/overview#token-refresh-mechanism)). Clerk's own framing — token expiration must be decoupled from session lifetime — is the part worth keeping; its 60-second default is not.

The client is a Next.js App Router application that already renders public pages on the server and will send authenticated requests for the workstation. Real-time hubs are planned. There is no backend code yet.

## Decision

Authentication is a server-side session that issues a short-lived JWT. The session row is the source of truth; the token is a derivative of it.

- **Session.** One `auth.sessions` row per sign-in, with an absolute lifetime of 7 days, never extended by activity. It records the refresh token hash, rotation state, a token version, and revocation.
- **Access token.** An HS256 JWT with a 10-minute lifetime, claims `iss`, `aud`, `sub`, `name`, `role`, `sid`, `ver`, `jti`, `iat`, `nbf`, `exp`. It is validated statelessly. Clock skew is set to zero: the framework default of 300 seconds would silently extend a 10-minute token to 15.
- **Refresh token.** An opaque 256-bit random value, stored only as SHA-256, rotated on every use, with a 30-second grace in which a replayed previous token returns the same replacement instead of revoking the session. A replay outside the grace revokes the session. This is refresh token rotation with replay detection ([RFC 9700 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2)).
- **Transport.** Both tokens are `HttpOnly` cookies: the access token `SameSite=Lax` on `/`, the refresh token `SameSite=Strict` scoped to `/api/auth`. No token is ever returned in a JSON body, stored in JavaScript, or placed in a URL.
- **Authorization.** The API denies by default (`FallbackPolicy = RequireAuthenticatedUser`); public reads opt out explicitly with `AllowAnonymous`. Writes and private reads additionally verify that the session is live, so revocation is immediate there even though stateless reads may continue for up to 10 minutes. Roles are `author` (default) and `moderator`; **guest is not a stored role** — it is the anonymous principal.
- **Resource rules.** Author-only visibility of tombstoned records, author-only edits, vote uniqueness, and "staff never rate" are resource-based authorization checks in the owning module, not role checks.
- **Transport topology.** Same-origin deployment is preferred (one reverse proxy in front of the client and the API), so cookies are first-party and cross-site cookie policy never enters the threat model. Development may use CORS with credentials or a rewrite.

## Consequences

**Positive.** Revocation is real: closing a session ends writes immediately and reads within ten minutes, rather than at the token's natural expiry. A stolen refresh token can be detected. No credential is reachable from JavaScript, which removes the most common token-theft path. The JWT is still available to SignalR and to future non-browser clients.

**Negative.** A revocation of a stateless read can lag by up to ten minutes; the archive's public reads make this acceptable, private reads do not rely on it. The refresh endpoint is new availability surface: a failed refresh signs users out, so its errors must be boring and well tested. Rotation introduces a concurrency problem that the grace window only mitigates. The design assumes one origin or a BFF; a genuinely cross-site deployment would force `SameSite=None` and a separate CSRF story. Passkeys, if added, make the account AAL2, which NIST caps at 24 hours overall and one hour idle — the 7-day session would then be non-conforming for those users.

**Follow-ups.** [`ARCHITECTURE.md`](../../ARCHITECTURE.md) must be updated: `Users.Role` drops `guest`; a sessions table, the endpoint contract, the status-code rules, and the token parameters are added. Data Protection keys must be persisted if the grace window encrypts the replacement token. Key rotation is deferred; rotating the signing key currently signs everyone out.

## Alternatives considered

- **ASP.NET Core Identity's built-in API endpoints (`MapIdentityApi`).** Rejected. It is the fastest path to a login form, but its refresh token is a Data Protection ticket with a sliding 14-day window, no rotation, no replay detection, no revocation, and it is not a JWT ([source](https://github.com/dotnet/aspnetcore/blob/release/10.0/src/Security/Authentication/BearerToken/src/BearerTokenHandler.cs)). Identity is still used for users, password hashing, and lockout.
- **An opaque session cookie and no JWT.** Simpler and stronger on revocation, but it gives SignalR and a future native client nothing to present as a bearer credential, and every request pays for a session lookup. Viable if the Next.js server is the only client forever.
- **A managed identity provider (Clerk, Auth0, Entra External ID).** Deferred. It would remove credential storage, passkeys, and email flows from scope, but adds a vendor, a bill, and a second source of truth for an identity that every archive record cites. It also caps the session at the vendor's policy.
- **A bearer token in browser memory, refreshed by a Route Handler.** It keeps the access token out of cookies, but every browser call then needs a token injected by JavaScript and re-acquired on reload, and the token is reachable by any XSS. The cookie transaction is strictly smaller.
- **A 60-second access token (the Clerk default).** Rejected after measurement: it multiplies refresh traffic by ten and turns clock skew from a footnote into a defect, for a revocation improvement that matters only to public reads.

## References

- [RFC 9700 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) — refresh token rotation and replay detection.
- [NIST SP 800-63-4](https://pages.nist.gov/800-63-4/sp800-63b.html) — AAL reauthentication timeouts; a valid token is not evidence the subscriber is present.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html) cheat sheets — no credentials in JavaScript storage; short expiry; denylist keyed on `jti`.
- [OWASP ASVS 5.0 V10](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x19-V10-OAuth-and-OIDC.md) — rotation and revocation on reuse for public clients.
- [ASP.NET Core policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0) — fallback policies and the default-deny pattern.
- [SignalR authentication](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-10.0) — a connection's principal is fixed at connect time.
- [Clerk token refresh](https://clerk.com/docs/guides/how-clerk-works/overview#token-refresh-mechanism) and [session options](https://clerk.com/docs/guides/secure/session-options) — the 60-second token, the 7-day maximum session, and the rationale for decoupling them.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3.5.1, §4.1, §11 — the draft user schema, auth endpoints, and security section this ADR replaces.
