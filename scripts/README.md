# Repository scripts

## Responsibility and structure

`check-repository.ts` enforces a `README.md` in every authored folder and ancestor. It uses null-delimited Git paths, excludes generated folders, and runs Git's whitespace check. It exempts `.github` itself, whose folder notes live in `ABOUT.md`, and rejects `.github/README.md` because GitHub would render that file as the repository README ahead of the root file. `repositoryPaths` takes the environment it reads the index with: the command line inherits its own, so a hook sees the index of the commit in progress, while a caller that owns a scratch repository passes an environment with git's variables removed.

## Usage

- `bun run check`: check tracked and unignored files, including new local files.
- `bun run check:staged`: check the complete Git index and staged whitespace. Missing unstaged READMEs do not count.
- `bun run test`: run policy unit tests and Git-index integration tests.

## Boundaries

Keep repository automation here; application business logic belongs in its module. These checks verify documentation presence, not README quality, license compliance, or application correctness. Extend checks when application tooling is configured.
