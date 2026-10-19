# Frontend source

## Responsibility and structure

- `app/`: the `[lang]` route segment, document layout, metadata, fonts, and global theme.
- `components/`: desktop shell, folder navigation, the language switcher, and reusable primitives.
- `i18n/`: locale routing, catalog loading, and locale-aware navigation.
- `proxy.ts`: the request-time language decision followed by session refresh.
- `lib/`: shared utilities.

Keep source here and tooling configuration at the client root. Translated copy lives outside this tree, in `../messages/`; nothing under `src/` hard-codes a sentence a reader sees. The desktop uses local presentation state; authentication transport lives in `lib/auth/`. Use the `@/` alias for imports. Verify with `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` from `client/`.
