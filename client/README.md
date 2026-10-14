# CIRCA frontend

## Responsibility

Next.js frontend with an initial CIRCA/OS desktop at `/` and `/desktop`: shortcut navigation, draggable and resizable destination windows, a Start launcher, taskbar, status strip, emblem wallpaper, and a switchable CRT overlay. Window contents are labeled placeholders; application screens and backend integration remain unimplemented.

## Structure and boundaries

- `src/app/`: routes, root layout, global theme, and [desktop design decisions](src/app/desktop/README.md).
- `src/components/`: desktop shell, reusable navigation and icons, and shadcn/ui primitives.
- `src/lib/`: shared class-composition helper.
- `tests/`: Vitest interaction and utility tests.
- `e2e/`: responsive Playwright desktop tests.
- `public/`: supplied emblem wallpaper and the Windows 98 shortcut [icon set](public/icons/README.md).

`react-rnd` provides the window frame and resize handles; the shell drives position, stacking, minimize, and maximize. Domain rules and API authorization belong in `../backend/`.

## Development and verification

Use Bun 1.3.14 and Node.js 20.9 or newer. From `client/`:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

Development serves http://localhost:3001. `bun run start` serves a production build. Browser tests require Chromium (`bunx playwright install chromium`) and use port 3001.

## Theme

Detailed component colors in `../.agents/brain/DESIGN.md` provide steel-blue surfaces, hard corners, and bevels. The supplied image controls desktop composition. DM Sans and IBM Plex Mono are bundled locally. The global screen overlay is pointer-transparent and can be disabled using CRT in the taskbar.

See [third-party notices](THIRD_PARTY_NOTICES.md) for copied component licensing. Every new authored folder needs a README.
