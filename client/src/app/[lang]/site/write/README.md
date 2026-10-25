# Author landing

## Responsibility and structure

`page.tsx` serves the localized `/site/write` author landing inside the full archive frame, including the shared footer. `editor/` owns the compact incident editor route.

## Boundaries and design decisions

Paper cards offer five creation types in two columns beneath a guidelines action bar; the final odd card spans the row. Only incident writing is available; evidence, characters, organizations, and rumours are disabled placeholders. Guidance opens the existing author guide. The archive navigation now opens this landing.

The draft list reads the existing single active browser-local incident draft without creating or overwriting it. Empty, loading, and read-error states are distinct. Both the incident card and draft continuation open `/{lang}/site/write/editor`, which retains the existing restoration behavior. Multiple drafts and server submission remain outside this change.

Presentation and local draft loading live in [archive components](../../../../components/archive-site/README.md). This page preserves the archive palette and typography, stacks the cards to one column on phones, and keeps visible keyboard focus.

## Verification

From `client/`, run `bun run test -- tests/archive-write.test.tsx` and `bun run test:e2e -- e2e/archive-write.spec.ts`. Open `/en/site/write` or `/ko/site/write`.
