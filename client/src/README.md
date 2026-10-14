# Frontend source

## Responsibility and structure

- `app/`: Next.js routing, metadata, fonts, and global theme.
- `components/`: reusable presentation primitives.
- `lib/`: shared utilities.

Keep source here and tooling configuration at the client root. No application behavior is implemented. Use the `@/` alias for imports. Verify with `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` from `client/`.
