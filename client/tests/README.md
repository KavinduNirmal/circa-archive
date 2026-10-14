# Frontend unit tests

## Responsibility and structure

- `setup.ts`: DOM matchers and cleanup.
- `utils.test.ts`: class composition and Tailwind conflict resolution.
- `desktop.test.tsx`: folder navigation, Escape dismissal, and Start launcher behavior.
- `window-registry.test.ts`: focus handover when a window is minimized or closed.
- `window-manager.test.tsx`: window placement, drag and resize, maximize, stacking, and taskbar state.
- `archive-index.test.ts`: the archive query rules, ranking, and the shipped fixture's formats.
- `browser.test.tsx`: the single tab, the search flow, the record view, the refusals, and the blocked controls.
- `mailbox-index.test.ts`: folder splits, read state, sorting, find, and the queue stamp.
- `mail.test.tsx`: the panes, reading and marking read, sorting, find, delete, queueing, and the retention refusal.

## Usage and boundaries

Run `bun run test` or `bun run test:watch` from `client/`. Browser interaction and responsive checks belong in `../e2e/`; repository tooling tests remain separate.
