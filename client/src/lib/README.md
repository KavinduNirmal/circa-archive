# Shared utilities

## Responsibility and structure

- `utils.ts`: shadcn's `cn` helper, combining conditional class names and resolving conflicting Tailwind utilities.
- `markdown/`: the record [Markdown renderer](markdown/README.md) — one parse pipeline shared by the sheet and the exports, with no React and no DOM.
- `desktop-destinations.ts`: the workstation's destination list, copy lookups, explorer naming, and the file-browser scope set. Server routes and the URL mapper derive from it, so a shortcut and its address cannot drift apart.
- `desktop-types.ts`: the window-state contracts (`WindowGeometry`, `DesktopArea`, `WindowSpec`, `WorkstationWindowState`) and the frame metrics both the store and the window component clamp by.
- `desktop-windows.ts`: the one composition of a destination's or a record's window title, so the shell, a deep link, and a restored session open identically named frames.
- `desktop-route.ts`: the pure mapping between a locale-less pathname and the resource it names (`/desktop`, `/desktop/{destination}`, `/desktop/record/{code}`), plus the code and destination validators the server pages guard with.
- `record-trail.ts`: the reader's trail type and the pure `open`/`step`/`normalise` operations, including the revisit rule that moves the cursor instead of appending a duplicate.

## Boundaries and verification

Keep framework-independent shared helpers here; component presentation belongs in `../components/` and stateful orchestration in `../stores/`. These modules carry no translated copy and no React; they take a translator when they compose a title. `desktop-types.ts` imports `DesktopIconSpec` as a type only, so no component enters the store's module graph.

Add meaningful tests before changing utility or renderer behavior. Run `bun run test` and `bun run typecheck` from the client root; `tests/workstation-store.test.ts` covers the trail operations through the store's public actions, and `tests/desktop-route.test.ts` holds every destination and archive code to a path round-trip.
