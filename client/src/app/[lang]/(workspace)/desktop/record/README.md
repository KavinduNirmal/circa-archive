# Record addresses

## Responsibility

The record half of the workstation URL scheme: `/{lang}/desktop/record/{code}`.
The code segment lives one level down, in [`[code]/`]([code]/README.md); this
folder exists because the route needs a literal `record` segment so it cannot
collide with a destination id.

## Structure

- `[code]/`: the URL marker page and its [notes]([code]/README.md).

## Boundaries

The folder holds no page of its own: `/desktop/record` falls through to the
destination route, where `record` is not a destination and therefore 404s. The
mapping between a code and this address is owned by
`client/src/lib/desktop-route.ts`, and the reader it opens by
`DesktopUrlSync`.

## Usage and verification

The public `/{lang}/site/records/[code]` page remains the canonical address for a
record. Run `bun run build` to see every code prerendered here, and the browser
suite for the encoded continuity code and the unknown-code 404.
