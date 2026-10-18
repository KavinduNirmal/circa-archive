# Workstation store

## Responsibility

Own everything that survives a window being rearranged: the open windows and their
geometry, which one holds focus, the reader's record trail, the CRT preference, and
the measured desktop area. It also records why the address bar should move after an
action, so routing stays in one component instead of spreading through the shell.

## Structure

- `workstation-store.ts`: `createWorkstationStore`, the action set, and the
  `HistoryIntent` contract. A factory rather than a module singleton, so a server
  render and each test get their own instance.
- `workstation-store-provider.tsx`: the React context, `WorkstationStoreProvider`,
  and the `useWorkstationStore(selector)` hook. The provider's position sets the
  state's lifetime.

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

## Usage and verification

`DesktopShell` reads the store through the compatibility hook
`useWorkstationWindows`; the workspace layout mounts the provider above it.
`src/lib/desktop-types.ts` and `src/lib/record-trail.ts` hold the pure state
contracts, so this folder never imports a `"use client"` component for its types.

Run `bun run test` from `client/`; `tests/workstation-store.test.ts` covers the
window invariants, the trail dedupe, geometry, and restored-state repair.
