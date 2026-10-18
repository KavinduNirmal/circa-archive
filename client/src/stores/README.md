# Workstation store

## Responsibility

Own everything that survives a window being rearranged: the open windows and their
geometry, which one holds focus, the reader's record trail, the CRT preference, and
the measured desktop area. It also records why the address bar should move after an
action, so routing stays in one component instead of spreading through the shell.

## Structure

- `workstation-store.ts`: `createWorkstationStore` (no persistence) and
  `createPersistedWorkstationStore` (per-tab session storage), the shared action
  set, the `HistoryIntent` contract, and `validateRestored`. Factories rather than
  module singletons, so a server render and each test get their own instance.
- `workstation-store-provider.tsx`: the React context, `WorkstationStoreProvider`,
  and the `useWorkstationStore(selector)` hook. The provider's position sets the
  state's lifetime; it rehydrates and validates on mount.

## Boundaries

The store holds no translated copy and no routing. Window titles arrive with their
`WindowSpec`; the URL is written by `DesktopUrlSync`, which reads `historyIntent`
and clears it. Actions that change *which document is focused* set an intent —
`"push"` for a newly opened document, `"replace"` for a focus change, minimize, or
close — while geometry, maximize, and the screen filter set none.

These stay out of the store on purpose:

- Each application's internal state (the browser's document stack, the explorer's
  folder history, mail selection, the word processor's undo stack). Minimized
  windows are hidden rather than unmounted, so the components already keep it.
- Transient shell chrome (`startOpen`, `settingsOpen`), which no other component
  needs and no URL addresses.
- Session-only state that is not part of the workspace (`historyIntent`,
  `hydrated`) is deliberately excluded from persistence.

The window identity rule is unchanged from the hook it replaces: one window per
destination id, so reopening focuses and never duplicates. The reader is one
window whose `readerTrail` moves, not one window per record.

## Persistence

The workspace is stored under `circa.workstation.v1` in `sessionStorage`, which is
per tab and cleared when the tab closes — a workspace rather than a saved profile.
`skipHydration` keeps the first client render identical to the server's; the
provider rehydrates after mount and then calls `validateRestored`, which drops
frames whose id no longer resolves, repairs the trail, clamps geometry once the
desktop layer is measured, and only then sets `hydrated`. `DesktopUrlSync` waits
for that flag, so a deep link cannot be adopted into a half-restored desktop and
the stored focus cannot beat the address.

Storage is treated as untrusted: a malformed payload is "nothing stored", a
window id is only kept if it still names a destination (or the reader), and
`historyIntent` and `hydrated` are never written. A restore also refuses to
overwrite a workspace that already has windows, so a click that lands before
hydration wins.

Nothing is written until the stored payload has been read. The shell publishes its
measured desktop area on mount, and that write must not replace the saved
workspace with the empty one being restored — the failure looks exactly like a
refresh that keeps only the URL's window.

## Usage and verification

`DesktopShell` reads the store through the compatibility hook
`useWorkstationWindows`; the workspace layout mounts the provider above it.
`src/lib/desktop-types.ts` and `src/lib/record-trail.ts` hold the pure state
contracts, so this folder never imports a `"use client"` component for its types.

Run `bun run test` from `client/`; `tests/workstation-store.test.ts` covers the
window invariants, the trail dedupe, geometry, and restored-state repair, and
`tests/desktop-persistence.test.tsx` covers the hydration ordering and the URL
winning over a restored focus.
