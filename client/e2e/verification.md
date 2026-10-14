# Desktop implementation verification

Verified on 2026-10-15 against the client at port 3001. This report covers the shell (navigation, icons, taskbar), not future application contents.

## Evidence

Checks that ran and passed from `client/`:

- `bun run lint`: clean, no warnings.
- `bunx tsc --noEmit`: clean.
- `bun run test`: 7 Vitest tests passing, including the icon-artwork map, shortcut-marker placement, My PC nesting with the System back-track, taskbar notifications, the CRT setting, and dialog dismissal.
- `bun run build`: production build succeeds; `/` and `/desktop` prerender as static.

Checks that ran from the repository root:

- `bun run test`: 7 repository tooling tests passing.
- `bun run check`: passes once the empty `.playwright-browsers/` directory left by an aborted browser install is removed.

Server-rendered evidence from the development server at port 3001:

- `/desktop` markup contains all nine desktop shortcuts (`My PC`, `My Documents`, `Archive`, `Organizations`, `Inbox`, `CIRCA Word`, `Search`, `_EXPUNGED`, `Recycle Bin`) and both tray controls (`Notifications`, `Settings`), with `WRITE.exe` and a desktop-level `System` shortcut absent.
- Exactly two `[data-shortcut]` markers render, on Archive and _EXPUNGED, each pointing at `/icons/overlay_shortcut-2.png`.
- Every `/icons/*.png` referenced by the markup returns `200 image/png`.
- Compiled CSS confirms the reviewed values: 48px desktop icons, 24px shortcut marker, one-column 92px left rail, no wallpaper dimming gradient, no filled label plate, per-pixel `saturate(.4) brightness(.85)` icon filter, and no `mix-blend-mode` rule.

## Limitations

- The Playwright suite (`bun run test:e2e`) is written for the redesigned shell but was not executed here: Chromium is not installed, and this environment's `~/.cache/ms-playwright` install target is read-only. Run `bunx playwright install chromium` and `bun run test:e2e` to execute it.
- Because the browser suite did not run, viewport-by-viewport screenshot inspection was not repeated for this pass. The values above were verified in compiled CSS and server markup rather than in rendered pixels. Refresh the running page and inspect 1440px, 640px, and 390px widths to confirm the rail, marker placement, and mobile two-column wrap visually.

## Outstanding content

- `My Documents` reuses the closed-folder bitmap, the conventional generic-folder choice. A dedicated dossier-style bitmap would read more specifically if one is supplied.
