# Shared utilities

## Responsibility and structure

`utils.ts` exposes shadcn's `cn` helper, combining conditional class names and resolving conflicting Tailwind utilities.

## Boundaries and verification

Keep framework-independent shared helpers here; component presentation belongs in `../components/`. Add meaningful tests before changing utility behavior. Run `bun run test` and `bun run typecheck` from the client root.
