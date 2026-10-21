# Project website unit tests

## Responsibility

Behavioral tests for public content boundaries, links, rendering, and localization.

## Structure and boundaries

Keep project presentation separate from the Next.js archive and workstation. Public article sources remain in the repository documentation; private notes are never published.

## Usage and verification

From `meta/`, run `bun run typecheck`, `bun run test`, and `bun run build`. See the [project guide](../README.md) for development and browser checks.
