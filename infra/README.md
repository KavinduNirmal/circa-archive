# Local ingress

## Responsibility and structure

- `nginx.conf`: public gateway template selecting the project and archive hosts, redirecting old project URLs, and routing archive APIs and Next requests.
- `15-site-origins.envsh`: validates configured HTTP(S) origins, derives distinct DNS/IPv4 hostnames, and restricts Nginx environment substitution to the three public template variables. Nginx request variables remain intact.
- `test-ingress.py`: real memory/CPU-capped disposable Nginx and Node containers. Verifies both hosts, static 404s, legacy redirects with queries, API/Next routing, cookie forwarding, IP replacement, and project availability after stopping the application fixture. Removes only its own named containers and network.

The static [project service](../meta/README.md) builds independently and serves generated Astro output with its own Nginx configuration. The gateway is the sole public entry point in Compose; the static service and Next have no published ports.

## Origins and configuration

`PROJECT_SITE_ORIGIN` defaults to `http://project.localhost:3001`; `ARCHIVE_SITE_ORIGIN` defaults to `http://localhost:3001`. Configure both explicitly when changing domains or the published gateway port. They must have distinct hostnames. Subdomains of localhost resolve to loopback in modern browsers; tests set Host directly and require no hosts-file edits. Direct Next development defaults project links to port 4321 instead.

The archive host proxies `/api/` to the API and other application requests to Next, including development WebSockets. Locale-prefixed `/meta` routes receive 308 redirects to the project origin, preserving query strings. Browsers inherit fragments; the project page handles relocated About fragments. Bare old paths first use Next's existing locale negotiation.

The project host proxies to the static site, strips incoming Cookie headers, and does not expose account APIs. Its liveness is independent of the application/backend. Static Nginx uses real files and returns 404 for unknown routes. Fingerprinted assets are immutable; other content revalidates. Gateway `/healthz` reports ingress liveness; individual services have separate readiness checks.

For production, set the public origins to HTTPS and configure certificates at the trusted edge. Keep external TLS termination and proxy trust consistent; the local template replaces `X-Forwarded-Proto` with its actual connection scheme and does not trust browser claims. No certificates or DNS changes are performed by these files.

## Trust boundary

The gateway and frontend retain their fixed addresses on the separate Compose ingress network. Only these addresses are trusted by ASP.NET forwarding middleware. Nginx replaces forwarded IP headers with the socket address, preserves Origin and both HttpOnly session cookies on archive requests, and never appends an untrusted forwarding chain. Project-site links do not widen authentication cookies, API CORS, or trusted proxies.

## Usage and verification

From the repository root:

```sh
docker compose config --quiet
docker compose build circa-meta
python3 infra/test-ingress.py
docker compose up --build --detach --wait
```

Supply root environment secrets before starting the full stack. The ingress test needs Docker, Python 3, `nginx:stable-alpine`, and `node:24-bookworm-slim`; it does not start or modify the application's database. Run checks sequentially on constrained machines. Build and test new site and gateway artifacts before live cutover; retain the previous versions for rollback without database changes.
