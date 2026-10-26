# Recovery routes

## Responsibility

Own the URL space for individual recovery registry entries.

## Structure

- `[code]/page.tsx` loads and renders one API-backed recovery.
- `[code]/README.md` documents the leaf route.

## Boundaries

This folder owns route composition only. Search contracts live in `lib/search`; shared archive presentation lives in `components/archive-site`.

## Usage and verification

Visit `/{lang}/site/recoveries/ITM-000000` with `SEARCH_SOURCE=api` and a running archive API.
