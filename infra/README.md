# Local ingress

## Responsibility and structure

`test-ingress.py` verifies the real proxy with two memory/CPU-capped disposable
containers and removes its own containers/network afterward. It requires Python 3,
Docker, and the Node/Nginx images used by the stack. Run `python3 infra/test-ingress.py`
from the root, separately from other checks.

`nginx.conf` is the single public HTTP entry point for the local Compose stack.
It sends `/api/` to the API and other requests to Next.js, including development
WebSockets. It replaces inbound forwarding headers with the socket peer address.

## Trust boundary

The gateway and frontend have fixed addresses on the separate Compose `ingress`
network; only these two addresses are trusted by ASP.NET forwarding middleware.
The frontend is not published directly. Server-side Axios interceptors forward
one validated address from the gateway only when `TRUST_PROXY_HEADERS=true`.
Outside this topology that setting must remain unset unless the deployment's
edge replaces incoming forwarding headers and prevents direct frontend access.
The API's loopback-published development port does not trust arbitrary callers.

The default network stays available to the database and API. Configure
`CIRCA_PROXY_NETWORK_PREFIX` if the ingress subnet conflicts with another local
network. No database migration or volume deletion is needed.

## Usage and verification

From the repository root, use `docker compose config --quiet` and
`docker compose up --build --detach --wait` with the root environment template.
The gateway health check reaches the API through its public route. The
[IP integration tests](../backend/tests/Circa.Api.IntegrationTests/ForwardedAddressTests.cs)
check trusted peers, spoofed headers, one-hop limits, and recorded login IPs.
The [client auth tests](../client/tests/auth-client.test.ts) cover browser header
stripping and cookie authentication; server session tests cover explicit proxy
trust. Run tests in sequential, single-worker batches on constrained machines.
