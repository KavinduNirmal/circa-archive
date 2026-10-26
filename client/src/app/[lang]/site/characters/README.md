# Character routes

## Responsibility

Own the URL space for public character dossiers.

## Structure

- `[code]/page.tsx` loads and renders one API-backed character.
- `[code]/README.md` documents the leaf route.

## Boundaries

This folder owns route composition only. Character usage permissions and edits remain in archive services.

## Usage and verification

Visit `/{lang}/site/characters/CHR-000000` with `SEARCH_SOURCE=api` and a running archive API.
