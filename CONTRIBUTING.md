# Contributing to CIRCA Archive

Contributions to the archive, the workstation, documentation, design, and the draft architecture are welcome. Read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Writing stories

For Incident and Exploration Record contributions, read the [Author guide](docs/AUTHOR_GUIDE.md). It separates protected Core Rules, challengeable observations, character permissions, independent publication, and continuity adoption. This pre-release framework describes intended platform policy; the current client does not implement these workflows.

Repository changes follow the development process below. Fictional procedures and platform collaboration permissions are documented separately.

## Before starting

1. Read the [README](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and the relevant [client documentation](client/README.md).
2. Search existing issues and pull requests for related work.
3. Open a proposal before making substantial architecture, dependency, or story-mechanic changes. Small corrections can go straight to a pull request.

CIRCA Archive is in pre-release development. `ARCHITECTURE.md` is a draft, and several product decisions are still open. Call out inconsistencies and explain the proposed resolution instead of silently choosing one side.

## Branch model

`develop` is the default branch and the integration point for ordinary work. `main` contains released code. Do not commit directly to either branch.

| Branch              | Use                                               |
| ------------------- | ------------------------------------------------- |
| `feature/<topic>`   | New behavior or a substantial enhancement         |
| `fix/<topic>`       | A defect fix                                      |
| `docs/<topic>`      | Documentation or specification changes            |
| `chore/<topic>`     | Tooling, dependencies, and repository maintenance |
| `release/<version>` | Release preparation, cut from `develop`           |
| `hotfix/<version>`  | Urgent production fix, cut from `main`            |

Branch from `develop` for the first four. Release and hotfix branches are maintainer-owned. Open ordinary pull requests against `develop`; see [docs/GITFLOW.md](docs/GITFLOW.md) for the complete release and hotfix procedure.

## Local workflow

Fork the repository, clone your fork, and create a focused branch:

```sh
git switch develop
git pull --ff-only
git switch -c feature/record-search
```

Use Bun 1.3.14 and Node.js 20.9 or newer. Install and initialize the hooks:

```sh
bun install --frozen-lockfile
bun run prepare
cd client && bun install --frozen-lockfile
```

Run the relevant checks before pushing:

```sh
bun run check
bun run test
bun run check:client
bun run --cwd=client build
```

`bun run precommit` reproduces the staged repository checks, tooling tests, and frontend lint, typecheck, and unit tests. Browser tests run with `cd client && bun run test:e2e` after installing Chromium.

Do not commit local environment files, credentials, build output, or editor settings. Keep real values in an ignored local environment file and placeholders in `.env.example`.

### Local-only ignore rules

Use a `.local.gitignore` file for machine-specific paths instead of adding them to the shared `.gitignore`. The file ignores itself, and each clone activates it once:

```sh
git config --local core.excludesFile "$(git rev-parse --show-toplevel)/.local.gitignore"
```

## Tests and verification

Follow red → green → refactor for new behavior and bug fixes:

1. Write a focused behavioral test.
2. Run it and confirm it fails for the expected missing behavior.
3. Implement the smallest coherent change that passes.
4. Refactor while the tests stay green.

For a bug, add a regression test before the fix. Test observable contracts and meaningful edge cases, especially authorization, voting, lifecycle transitions, and record visibility. Do not delete or weaken failing tests to make a change pass.

Documentation changes need link, rendering, and consistency checks rather than artificial unit tests. Report exactly what you ran and what could not run; do not claim that an unexecuted check passed.

## Documentation

Every authored folder needs a `README.md` explaining:

1. **Responsibility:** what the folder owns and why it exists.
2. **Structure:** important files and subfolders.
3. **Boundaries:** what belongs here and what belongs elsewhere.
4. **Usage and verification:** real commands and data flow where relevant.

Generated, dependency, ignored, and Git metadata folders are excluded. `.github` uses `ABOUT.md` instead because GitHub renders `.github/README.md` as the repository README, ahead of the root file. Stage documentation alongside the code it describes; an unstaged README does not satisfy the commit hook.

Architecture decisions are recorded as ADRs in [docs/adr](docs/adr/README.md). Copy the template, take the next number, and write the context, the decision, its consequences, and the alternatives that lost. An accepted ADR is not rewritten; a later ADR supersedes it.

## Commits and pull requests

Use concise imperative commit messages, for example `Document organization appeals` or `Keep focus after closing a window`. Make one coherent change per pull request. No commit prefix is required; the branch name carries the category.

Complete the pull request template:

- Explain the problem and the resulting behavior.
- Link an issue or the relevant specification section.
- Mark the target branch (`develop`, or `main` for a release or hotfix branch).
- Report verification commands and outcomes.
- Include before/after screenshots for interface changes.
- Note configuration, dependency, or compatibility changes.

Pull requests are squash-merged into `develop`. Release and hotfix pull requests into `main` use a merge commit so the tagged history stays connected to `develop`. All required status checks and review conversations must be resolved before merging. Do not force-push or rewrite a branch under review.

## Licensing and reports

Submit only work you have permission to contribute under the [MIT License](LICENSE). Identify third-party material in `NOTICE` or [client/THIRD_PARTY_NOTICES.md](client/THIRD_PARTY_NOTICES.md), retain required notices, and do not copy reference fiction, artwork, or assets without permission. No contributor license agreement is currently required.

Report vulnerabilities according to [SECURITY.md](SECURITY.md), never in a public issue. Questions and support routes are listed in [SUPPORT.md](SUPPORT.md). Code of conduct reports go privately to **kavindunirmald@gmail.com**.
