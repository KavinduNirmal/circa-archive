# Desktop browser tests

## Responsibility and structure

`scaffold.spec.ts` verifies the workstation route, every shortcut, Start navigation, dialog dismissal and focus return, the CRT toggle, runtime errors, and horizontal overflow at 1440px, 640px, and 390px widths. Screenshots are written to `/tmp/circa-desktop-<width>.png` for visual inspection.

`landing.spec.ts` covers portal layouts at 1440px, 640px, 390px, and 320px, the archive entry, keyboard skip navigation, the withdrawn document, document disclosures, the correspondent notice changing for a moment and being put back, reduced motion (which stops the changing but keeps the static stamp askew), and the language path: a browser asking for Korean is redirected to the Korean portal, the switcher moves between languages without losing the page, and that choice is written to the `NEXT_LOCALE` cookie so a later bare visit lands on it. Run just this suite with `bun run test:e2e landing.spec.ts`. Captures are written to `/tmp/circa-portal-<width>.png`.

Bare paths are the entry point in these specs, so `page.goto("/")` and `page.goto("/desktop")` exercise the proxy redirect rather than bypassing it.

## Usage and boundaries

From `client/`, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. When the default browser cache is not writable, point `PLAYWRIGHT_BROWSERS_PATH` at a writable directory for both the install and the run. Playwright starts the development server locally and the production build in CI; the CI job builds before it runs the suite. Unit tests live in `../tests/`. Generated browser artifacts are excluded from source control.

## Verified state

The suite passes 17/17 against a production build. The CI browser job builds the client and starts `next start`, because a fresh development server hydrates the workstation too slowly for the boot handover window these specs allow; the production build is both representative and stable in that window.

Boot timing is worth knowing: `WorkstationBoot` schedules its handover from a line count rather than from the translated lines, because the translator is a new value on every render and depending on it restarted the schedule at each reveal, holding the operator at the post screen for twice the intended time. That regression is invisible to the unit suite, which drives fake timers, and is caught only by running the browser suite.
