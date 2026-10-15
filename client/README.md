# CIRCA frontend

## Responsibility

Next.js frontend with a public landing page at `/` and the CIRCA/OS workstation at `/desktop`. The landing page is a dense institutional portal: public notices, filing procedures, organization particulars, credential status, and a prominent archive entry. Its copy and metadata remain in the Commission's voice. The workstation answers the arrival with a post screen, then runs shortcut navigation, draggable and resizable destination windows, a Start launcher, taskbar, emblem wallpaper, and a switchable CRT overlay. Every desktop destination opens a real screen over illustrative preview data: Search the archive browser, Inbox the mail client, each folder the file browser, and CIRCA Word the Markdown record editor. Backend integration remains unimplemented, so every screen reads from its own index rather than a service.

## Structure and boundaries

- `src/app/`: routes, root layout, global theme, and [desktop design decisions](src/app/desktop/README.md).
- `src/components/`: desktop shell, the public [site](src/components/site/README.md) and post screen, the archive [browser](src/components/browser/README.md), the [mail client](src/components/mail/README.md), the [file browser](src/components/files/README.md), the record [editor](src/components/word/README.md), reusable navigation and icons, and shadcn/ui primitives.
- `src/lib/`: shared class-composition helper.
- `tests/`: Vitest interaction and utility tests.
- `e2e/`: responsive Playwright desktop tests.
- `public/`: supplied emblem wallpaper and the Windows 98 shortcut [icon set](public/icons/README.md).

Windows are positioned elements with pointer-driven drag and corner resize; the shell owns geometry, stacking, minimize, and maximize. `react-rnd` is still installed but unused, kept only so a future pass can evaluate it without a reinstall. Domain rules and API authorization belong in `../backend/`.

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
