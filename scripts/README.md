# Repository scripts

## Responsibility and structure

`check-repository.ts` enforces a `README.md` in every authored folder and ancestor. It uses null-delimited Git paths, excludes generated folders, and runs Git's whitespace check.

## Usage

- `bun run check`: check tracked and unignored files, including new local files.
- `bun run check:staged`: check the complete Git index and staged whitespace. Missing unstaged READMEs do not count.
- `bun run test`: run policy unit tests and Git-index integration tests.

## Boundaries

Keep repository automation here; application business logic belongs in its module. These checks verify documentation presence, not README quality, license compliance, or application correctness. Extend checks when application tooling is configured.
