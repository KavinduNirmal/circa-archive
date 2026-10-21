# Destination route

## Responsibility

`/{lang}/desktop/{destination}` — the workstation with one shortcut focused. The
page is a URL marker: it matches and prerenders the address and validates the
segment, while the workspace layout owns the shell and `DesktopUrlSync` turns the
address into a window.

## Structure

- `page.tsx`: `generateStaticParams` over `allDestinations`, `dynamicParams =
false`, and a runtime `isDestinationId` guard that calls `notFound()`. It
  renders `null`.

## Boundaries

The page holds no copy, no layout, and no window logic. The destination list and
the URL mapping are pure modules in `client/src/lib/`
(`desktop-destinations.ts` and `desktop-route.ts`); this folder only binds them to
the App Router. `record` is not a destination, so `/desktop/record` never
resolves here.

## Usage and verification

Adding a shortcut to `desktopFolders` or `myPcContents` gives it an address on
the next build; `tests/desktop-route.test.ts` holds the round-trip, and the
browser suite covers the hard load and the unknown-segment 404.
