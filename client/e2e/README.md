# Desktop browser tests

## Responsibility and structure

`scaffold.spec.ts` verifies the workstation route, every shortcut, Start navigation, dialog dismissal and focus return, the CRT toggle, runtime errors, and horizontal overflow at 1440px, 640px, and 390px widths. Screenshots are written to `/tmp/circa-desktop-<width>.png` for visual inspection.

`landing.spec.ts` covers portal layouts at 1440px, 640px, 390px, and 320px, the archive entry, keyboard skip navigation, the withdrawn document, document disclosures, the correspondent notice changing for a moment and being put back, reduced motion (which stops the changing but keeps the static stamp askew), and the language path: a browser asking for Korean is redirected to the Korean portal, the switcher moves between languages without losing the page, and that choice is written to the `NEXT_LOCALE` cookie so a later bare visit lands on it. Run just this suite with `bun run test:e2e landing.spec.ts`. Captures are written to `/tmp/circa-portal-<width>.png`.

Bare paths are the entry point in these specs, so `page.goto("/")` and `page.goto("/desktop")` exercise the proxy redirect rather than bypassing it.

## Usage and boundaries

From `client/`, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. When the default browser cache is not writable, point `PLAYWRIGHT_BROWSERS_PATH` at a writable directory for both the install and the run. Playwright starts a development server when needed. Unit tests live in `../tests/`. Generated browser artifacts are excluded from source control.

## Verified state — localization pass

The suite was run for the first time against a production build on a spare port: 11 passing, 5 failing. The 11 include every portal test and the Korean language path.

The five failures are all in `scaffold.spec.ts` and all predate this work: the suite had never been executed, and its desktop assertions had drifted from the shell it tests. This pass corrected the ones the localization exposed and touched — window titles now include the explorer suffix, the Organizations glyph is `organizations` rather than `network`, the window controls are labelled with the full title, the archive glyph assertion, and the My PC navigation — which moved the run from 7 to 11 passing. What remains is drag/resize geometry, the taskbar restore focus round-trip, and two assertions inside the per-viewport shortcut loop. They are recorded here rather than deleted, because they describe behaviour the shell should have and someone should confirm whether the shell or the spec is wrong.

Boot timing is worth knowing: `WorkstationBoot` schedules its handover from a line count rather than from the translated lines, because the translator is a new value on every render and depending on it restarted the schedule at each reveal, holding the operator at the post screen for twice the intended time. That regression was invisible to the unit suite, which drives fake timers, and was caught only by running the browser suite.

## Portal redesign — not yet run

`landing.spec.ts` was updated with the portal redesign of 2026-10-17: the assertion on the register mark's 80 ms shift was replaced with one on the correspondent notice changing and being restored, and the reduced-motion test now checks that the changing stops while the static stamp stays askew. The suite was **not run** in that pass: Playwright's Chromium is not installed here, and `bunx playwright install chromium` stalls when `PLAYWRIGHT_BROWSERS_PATH` is pointed at a writable directory because the default cache is read-only. Run it before relying on these assertions.
