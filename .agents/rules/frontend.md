# Frontend tooling and quality

- Prefer Bun for JavaScript/TypeScript package management in `client/`, future `admin/` code, and root tooling.
- Use `bun install`, `bun add`, `bun run <script>`, and `bunx <tool>`. Commit `bun.lock`; use `bun install --frozen-lockfile` for reproducible installs.
- Keep one package-manager lockfile per package/workspace. Introduce npm, Yarn, or pnpm only for a documented compatibility requirement or user direction.
- Respect existing package boundaries; do not assume a workspace before it exists. Backend .NET tooling remains separate.
- Use explicit TypeScript contracts when scaffolding. Keep components cohesive, separate presentation from business behavior, and minimize unnecessary client components or duplicated state.
- Follow the visual specification while providing keyboard navigation, visible focus, accessible labels, and responsive layouts. Verify interactive behavior, not only screenshots.
- Document actual lint, typecheck, test, and build commands as applications are introduced. Extend root checks and pre-commit checks accordingly; tooling tests do not validate application code.
- Run `bun install` at the root, then `bun run prepare` if hooks were not initialized during installation. Do not silently bypass failed hooks.
