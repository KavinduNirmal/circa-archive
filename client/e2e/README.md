# Desktop browser tests

## Responsibility and structure

`scaffold.spec.ts` verifies the workstation route, every shortcut, Start navigation, dialog dismissal and focus return, the CRT toggle, runtime errors, and horizontal overflow at 1440px, 640px, and 390px widths. Screenshots are written to `/tmp/circa-desktop-<width>.png` for visual inspection.

These viewport cases keep the cookie notice visible and assert that the canvas
ends at the taskbar before opening every shortcut. A separate regression expands
and dismisses the notice with a maximized window open, checking that the canvas
and window resize together. The drag/resize scenario uses an explicit roomy
viewport and checks available space before asserting the full pointer delta.

`landing.spec.ts` covers portal layouts at 1440px, 640px, 390px, and 320px, the archive entry, keyboard skip navigation, the withdrawn document, document disclosures, the correspondent notice changing for a moment and being put back, reduced motion (which stops the changing but keeps the static stamp askew), and the language path: a browser asking for Korean is redirected to the Korean portal, the switcher moves between languages without losing the page, and that choice is written to the `NEXT_LOCALE` cookie so a later bare visit lands on it. Run just this suite with `bun run test:e2e landing.spec.ts`. Captures are written to `/tmp/circa-portal-<width>.png`.

`desktop-deeplink.spec.ts` covers the workstation's URL scheme and history policy: a destination deep link, a record deep link, an encoded continuity code, unknown destinations and codes as 404s, opening from the rail pushing and Back restoring the previous address, Back/Forward moving the reader's cursor without appending to the trail, minimize and close fallbacks, the `noindex, nofollow` metadata, the Korean route, a refresh restoring the workspace with the URL's window focused, and a new tab starting empty.

Bare paths are the entry point in these specs, so `page.goto("/")` and `page.goto("/desktop")` exercise the proxy redirect rather than bypassing it.

## Usage and boundaries

From `client/`, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. When the default browser cache is not writable, point `PLAYWRIGHT_BROWSERS_PATH` at a writable directory for both the install and the run. Playwright starts the development server locally and the production build in CI; the CI job builds before it runs the suite. Unit tests live in `../tests/`. Generated browser artifacts are excluded from source control.

## Verified state

The suite passes 28/28 against a production build, including the cookie-notice canvas regression. The CI browser job builds the client and starts `next start`, because a fresh development server hydrates the workstation too slowly for the boot handover window these specs allow; the production build is both representative and stable in that window. Use `--workers=1` for sequential local runs on constrained machines.

Boot timing is worth knowing: `WorkstationBoot` schedules its handover from a line count rather than from the translated lines, because the translator is a new value on every render and depending on it restarted the schedule at each reveal, holding the operator at the post screen for twice the intended time. That regression is invisible to the unit suite, which drives fake timers, and is caught only by running the browser suite.

## Authentication integration

`auth.spec.ts` runs separately with `bun run test:e2e:auth` using `playwright.auth.config.ts`. It uses the real API and an isolated Testcontainers PostgreSQL database; Docker, .NET 10, and Chromium are required. It verifies cookie-based browser login, account lookup after reload, HttpOnly privacy, navigation refresh after access-cookie expiry, and logout denying the next write. It starts Next on port 3101 with a separate build directory and does not reuse an existing server. The regular frontend-only suite excludes this spec.

The auth suite now uses the actual sign-up and sign-in forms in English and Korean. It covers generated analyst-name previews and rerolls, persisted public profile details, the portal/archive access links, the moved project link, redirects, reload/expiry, credential privacy, logout success/failure, error feedback, keyboard submission, and invalid fields. It captures access pages at 390px and 1440px in `/tmp/circa-auth-*.png`. It runs one browser worker and bounds Next/.NET concurrency; run it separately from builds and unit suites on low-resource machines.

For a checkout-local browser installation, prefix the auth command with `PLAYWRIGHT_BROWSERS_PATH="$PWD/.pw-browsers"` when running from the repository root.

The auth browser suite also captures and dismisses the English/Korean cookie notice, checks that acknowledgement survives reload, and keeps notice preferences separate from the two HttpOnly authentication cookies.

`incident-editor.spec.ts` covers real Markdown editing, selection and undo across tabs, font-overlay metrics, browser draft/image restoration, restricted imports, temporary entities, and the mobile registry drawer. It captures desktop/mobile screenshots in `/tmp/circa-editor-*.png`. Set `CIRCA_E2E_PORT=3002` to use an alternate frontend port (default 3001).

The incident editor suite also checks that Form information and Content share a horizontal navigation row above the panel at 1440px and 390px, supports switching with the Right Arrow key, and exercises the heading dropdown and new code/reference/redaction quick actions.

`archive-navigation.spec.ts` checks hover continuity, keyboard dismissal and focus, click activation, and dropdown bounds at 1440px, 620px, and 390px. Screenshots are saved under `/tmp/circa-about-dropdown-<width>.png`.

`search.spec.ts` checks the canonical GET query, sealed incident stubs, filter-preserving pagination, and submitting the search form with JavaScript disabled.

`archive-write.spec.ts` checks author landing navigation, editor routing, local draft continuation, and narrow-screen layout.

## API-backed search destinations

`search-api.spec.ts` runs separately with `bun run test:e2e:search` and
`playwright.search.config.ts`. It uses disposable PostgreSQL, the real API on 5041,
and Next on 3102 with `SEARCH_SOURCE=api` and `.next/search-e2e`. Run separately from
the auth suite (which shares the test API port). Covers search-to-destination links,
incident acknowledgment, organization dossiers, rumour anchors, guest/moderator
stubs, approved-reader bodies, persistent pending requests, Korean/no-JavaScript
acknowledgment, and 390px/1440px captures at `/tmp/circa-api-reader-*.png`.

API search browser tests also open character/recovery dossiers and traverse three
cursor pages forward and backward. Run the browser suites and production builds
sequentially: the isolated E2E output folders are nested under `.next`, which a
production build clears.

`search.spec.ts` also preloads hostile saved-search URLs/names and verifies that
only canonical local links render, with markup remaining inert.
