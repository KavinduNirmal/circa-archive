# Frontend source

## Responsibility and structure

- `app/`: Next.js desktop routes, metadata, fonts, and global theme.
- `components/`: desktop shell, folder navigation, and reusable primitives.
- `lib/`: shared utilities.

Keep source here and tooling configuration at the client root. The desktop uses local presentation state with no backend integration. Use the `@/` alias for imports. Verify with `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` from `client/`.
