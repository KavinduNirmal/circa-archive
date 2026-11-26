# Project website browser tests

## Responsibility

Browser contracts for the redesigned publication: the flat navigation and dropdowns, documentation-only search, chapter disclosures, clipboard feedback, no-JavaScript navigation, and responsive reading in both languages.

## Structure and boundaries

`website.spec.ts` covers navigation, search scope, search recovery, Markdown copying, tables, language handling, legacy fragments, no-JavaScript behavior, and the 375/768/1024/1440 matrix. `identity.spec.ts` covers the editorial order, the empty-project note, the four-row starting index, the landing plate, the MIT licence link, the agency motto, support destinations, portrait failure fallback, control geometry, large-text reflow, and mobile focus return.

The suite runs against a production preview. Run `bun run build` first. `PLAYWRIGHT_PORT` changes the preview port (default `4321`); `PLAYWRIGHT_BASE_URL` overrides the base URL; `PLAYWRIGHT_REUSE=0` forces a fresh preview instead of reusing an existing server. Set `PLAYWRIGHT_BROWSERS_PATH` when Chromium is installed outside the default cache.

## Usage and verification

From `meta/`, run `bun run build && bun run test:e2e`. To validate a clean production build without a stale development server: `PLAYWRIGHT_PORT=4331 PLAYWRIGHT_REUSE=0 bun run test:e2e`. See the [project guide](../README.md).
