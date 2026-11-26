# Public

## Responsibility

Owns the public portion of the Astro website.

## Structure and boundaries

Keep project presentation separate from the Next.js archive and workstation. Public article sources remain in the repository documentation; private notes are never published.

- `seal.svg`: the supplied project seal.
- `library.jpg`: the supplied editorial library plate for the landing page, resized locally from the original image. It is illustrative, not a photograph of a real institution.
- `portraits/`: locally served contributor portraits with provenance in [portraits/README.md](portraits/README.md).

## Usage and verification

From `meta/`, run `bun run typecheck`, `bun run test`, and `bun run build`. See the [project guide](../README.md) for development and browser checks.
