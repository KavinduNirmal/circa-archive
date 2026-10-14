# Desktop browser tests

## Responsibility and structure

`scaffold.spec.ts` verifies `/` and `/desktop`, every shortcut, Start navigation, dialog dismissal and focus return, the CRT toggle, runtime errors, and horizontal overflow at 1440px, 640px, and 390px widths. Screenshots are written to `/tmp/circa-desktop-<width>.png` for visual inspection.

## Usage and boundaries

From `client/`, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. Playwright starts a development server when needed. Unit tests live in `../tests/`. Generated browser artifacts are excluded from source control.
