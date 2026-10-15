# Shared utilities

## Responsibility and structure

- `utils.ts`: shadcn's `cn` helper, combining conditional class names and resolving conflicting Tailwind utilities.
- `markdown/`: the record [Markdown renderer](markdown/README.md) — one parse pipeline shared by the sheet and the exports, with no React and no DOM.

## Boundaries and verification

Keep framework-independent shared helpers here; component presentation belongs in `../components/`. Add meaningful tests before changing utility or renderer behavior. Run `bun run test` and `bun run typecheck` from the client root.
