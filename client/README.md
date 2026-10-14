# CIRCA frontend scaffold

## Responsibility

Next.js App Router foundation for the public frontend. The home route intentionally renders no UI. No desktop shell, window manager, state store, or backend integration is implemented.

## Structure and boundaries

- `src/app/`: route, root layout, and CIRCA theme.
- `src/components/ui/`: shadcn/ui primitives; not mounted on a screen.
- `src/lib/`: shared class-composition helper.
- `tests/`: Vitest setup and utility tests.
- `e2e/`: Playwright scaffold smoke test.
- `public/`: static assets, currently unused by the empty page.
- `components.json`: shadcn registry and import aliases.

`react-rnd` is installed for future client-side draggable/resizable windows. Domain rules and API authorization belong in `../backend/`.

## Development

Use Bun 1.3.14 and Node.js 20.9 or newer (required by Next.js tooling). From `client/`:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
```

Development serves http://localhost:3000. `bun run start` serves a completed production build. To run the optional browser smoke test, install Playwright Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`.

## Theme and components

The theme follows the detailed palette and component geometry in `../.agents/brain/DESIGN.md`: naval surfaces, steel-blue accents, hazard amber, hard rectangular corners, compact labels, and raised/sunken bevel utilities. The document has conflicting palette values; detailed component colors take precedence here. DM Sans and IBM Plex Mono are bundled locally; builds do not fetch Google Fonts. Scanlines are an opt-in utility, not a global overlay.

Add primitives with `bunx --bun shadcn@latest add <component>` and keep CIRCA tokens and conventions. Application design and window behavior will be added separately. Every new authored folder needs its own README. See [third-party notices](THIRD_PARTY_NOTICES.md) for the copied component license.
