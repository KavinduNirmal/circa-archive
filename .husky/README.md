# Git hooks

## Responsibility and structure

`pre-commit` runs `bun run precommit`: repository-wide staged-file formatting through `bunx --no-install prettier --write --ignore-unknown`, then staged README/whitespace checks, repository tooling tests, and frontend lint/typecheck/unit tests. Husky generates the ignored `.husky/_/` support directory; do not edit or commit its contents.

## Setup and verification

Run `bun install` at the repository root. If needed, run `bun run prepare` to set `core.hooksPath` to `.husky/_`. Verify with `git config --get core.hooksPath`. Run `bun run precommit` manually to reproduce failures.

Install both root and client dependencies. Stage READMEs with their source changes and fix failures before committing. Frontend checks use the working tree, so review partial staging carefully. Production builds and optional browser smoke tests run separately. CI should run equivalent checks because local hooks can be bypassed.

## Formatting scope

The root Prettier configuration applies across all packages and documentation. The Astro parser is additive; formatting is not limited to `meta/`. Prettier formats supported file types (including TypeScript, JavaScript, CSS, JSON, YAML, Markdown, HTML, and Astro); C#, Python, shell, binaries, lockfiles, and generated output are not reformatted. `lint-staged` restores unstaged edits in partially staged files and stages only formatted versions of the selected changes. Unknown file types are skipped. The pinned root dependencies avoid downloading executables during a commit.

Run `bun run format` for a repository-wide pass or `bun run format:check` for a read-only check. Install root dependencies before committing.

The authored `client/public/Ghost_story.md` corpus uses custom redaction syntax inside tables and must remain byte-identical to its generated bundle. Both are excluded from Prettier; update them through `client/scripts/sync-corpus.ts`.
