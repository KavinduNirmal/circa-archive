# Repository Guidelines

## Project Structure & Module Organization

CIRCA Archive is in pre-production. The Next.js client scaffold serves an empty themed page; backend and application screens remain unimplemented.

Before editing, read every policy linked in [.agents/rules/README.md](.agents/rules/README.md). Follow TDD for behavior changes, use code as documentation, search skills.sh when relevant skills are missing, and prefer Bun for frontend packages.

- `client/`: Next.js, shadcn/ui, and react-rnd scaffold; see its README.
- `backend/`: planned .NET 10, EF Core, PostgreSQL, and SignalR services.
- `admin/`: reserved administration tooling.
- `docs/lore/`: fictional setting documentation.
- `.agents/brain/PROJECT_CONTEXT.md`: source of truth for product direction.
- `.agents/brain/DESIGN.md`: interface design specifications.
- `ARCHITECTURE.md`: draft technical architecture, schema, and API contracts.

Flag conflicting requirements and document decisions before implementation.

## Build, Test, and Development Commands

Use Bun 1.3.14 for root tooling:

- `bun install --frozen-lockfile`: install locked dependencies.
- `bun run prepare`: initialize Husky hooks.
- `bun run check`: verify authored folders have READMEs.
- `bun run test`: run repository tooling tests.
- `bun run check:client`: frontend lint, typecheck, and unit tests.
- `bun run precommit`: staged checks, tooling tests, and frontend checks.

Install client dependencies separately. Use `bun run --cwd=client dev` or `build` for the scaffold.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, LF endings, two-space indentation, and four spaces for C#. No formatter or linter is configured yet. Use PascalCase for React components and C# types, and camelCase for JavaScript variables and functions.

Preserve domain terminology: incidents, records, organizations, continuities, and tombstones. Store IDs, display codes, and render fictional `.pdf` records from Markdown.

Every authored folder requires `README.md` explaining responsibility, structure, boundaries, and actual usage. Generated and ignored folders are excluded. Update documentation with code changes.

## Testing Guidelines

Use red → green → refactor: confirm a failing behavioral test before implementation. Root tests use `bun:test`; frontend tests use Vitest and optional Playwright smoke tests. No coverage threshold exists. Prioritize authorization, lifecycle transitions, vote uniqueness, and visibility. Documentation edits need consistency and link checks.

## Commit & Pull Request Guidelines

Git has no commits, so no historical convention exists. Follow `CONTRIBUTING.md` and the GitHub PR template. Use imperative messages, such as `Add record creation endpoint`. Keep changes focused; describe behavior, link issues or specifications, report verification, and include screenshots for UI changes. Update affected documents.

## Security & Configuration

`.gitignore` excludes local environment files, credentials, and generated output. Keep only placeholder configuration in `.env.example`. Never commit JWT secrets, database passwords, or storage credentials. Follow `SECURITY.md` for private vulnerability reporting.
