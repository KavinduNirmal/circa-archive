# GitHub Actions workflows

## Responsibility

Run the repository's verification and security checks on every change, and publish a GitHub Release when a version tag is pushed.

## Structure

- `ci.yml`: repository tooling checks, client lint, typecheck, unit tests, production build, and Playwright end-to-end tests against that production build.
- `codeql.yml`: CodeQL analysis for JavaScript/TypeScript and GitHub Actions on pushes, pull requests, and a weekly schedule.
- `dependency-review.yml`: fails a pull request that introduces a high-severity vulnerable dependency.
- `release.yml`: creates a GitHub Release from a `v*.*.*` tag after confirming the tag is on `main`.

## Boundaries and usage

Workflows are the automation of record: run the same commands locally from the repository root or `client/` before pushing. Keep the Bun version aligned with `packageManager` in `package.json` and `client/package.json`. Job names are referenced by repository rulesets, so rename them only alongside the ruleset. Do not add secrets to workflows; the project uses the default read-only `GITHUB_TOKEN` except where a job declares a narrower write permission.

`ci.yml` also checks the independent Astro project (Node 24, Bun, lint, types, Vitest, static build and Chromium) and exercises real Nginx host routing through disposable Docker fixtures.
