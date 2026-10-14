# Git hooks

## Responsibility and structure

`pre-commit` runs `bun run precommit`: staged README/whitespace checks, repository tooling tests, and frontend lint/typecheck/unit tests. Husky generates the ignored `.husky/_/` support directory; do not edit or commit its contents.

## Setup and verification

Run `bun install` at the repository root. If needed, run `bun run prepare` to set `core.hooksPath` to `.husky/_`. Verify with `git config --get core.hooksPath`. Run `bun run precommit` manually to reproduce failures.

Install both root and client dependencies. Stage READMEs with their source changes and fix failures before committing. Frontend checks use the working tree, so review partial staging carefully. Production builds and optional browser smoke tests run separately. CI should run equivalent checks because local hooks can be bypassed.
