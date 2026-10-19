# Security

Provides HTTP pipeline hardening middleware including CSRF Origin validation and baseline security headers.

## Responsibility

- Enforces CSRF defense-in-depth by checking that unsafe mutation requests (`POST`, `PUT`, `DELETE`, `PATCH`) with an `Origin` header match the server's configured `AllowedOrigins`.
- Appends security headers (`X-Content-Type-Options`, `Referrer-Policy`, and restrictive API `Content-Security-Policy`).

## Structure

- `OriginValidationMiddleware.cs` — Inspects unsafe HTTP requests and rejects origin mismatches with 403 Forbidden and `origin_mismatch` problem details.
- `SecurityHeadersMiddleware.cs` — Adds defense-in-depth security headers to HTTP responses.

## Boundaries

Operates at the HTTP middleware pipeline level prior to endpoint dispatch and authentication.

## Usage

Registered in the application pipeline via `app.UseMiddleware<SecurityHeadersMiddleware>()` and `app.UseMiddleware<OriginValidationMiddleware>()`.

`AuthRateLimitPartitionMiddleware` reads bounded login JSON to normalize the identifier and resolves refresh cookies to a stable session id before the rate limiter. Raw credentials are never partition keys. IPs come only from the connection; configure trusted forwarded-header middleware at the host when deploying behind a proxy. Missing Origin is allowed for non-browser callers; supplied origins fail closed against the exact configured list.

Verify with `dotnet test backend/Circa.sln` from the repository root.
