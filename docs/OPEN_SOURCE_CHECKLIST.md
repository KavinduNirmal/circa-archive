# Open-source readiness checklist

Last reviewed: 2026-10-18

This is the living checklist for the public repository. Checked items are configured and verified; unchecked items are owner actions or release blockers. Re-run the verification commands at the bottom after changing repository settings.

## Repository content

- [x] MIT license in `LICENSE`, with the copyright notice held by the project contributors.
- [x] Public README with status, features, stack, layout, setup, checks, branching, and licensing.
- [x] Contribution guide, code of conduct with a private contact, security policy, and support guide.
- [x] Issue forms for bugs, proposals, and documentation, plus a pull request template.
- [x] Gitflow branch model, release checklist, and hotfix procedure in `docs/GITFLOW.md`.
- [x] Changelog and semantic-versioning policy.
- [x] Every authored folder documents itself; `.github` uses `ABOUT.md` so it does not replace the root README.
- [x] No secrets, private credentials, local environment values, internal planning notes, or local working files are tracked.
- [x] `.env.example` contains optional public-link placeholders only.
- [x] Third-party asset notice in `NOTICE` and `client/THIRD_PARTY_NOTICES.md`.

## GitHub configuration

- [x] Public repository with a description and relevant topics.
- [x] Default branch is `develop`; `main` is the release branch.
- [x] Issues enabled; wiki disabled so documentation stays in the repository.
- [x] Squash and merge-commit merges enabled; rebase merges disabled; merged head branches are deleted.
- [x] Rulesets on `main` and `develop` require a pull request, passing checks, and resolved conversations; force pushes and deletion are blocked.
- [x] Tag ruleset prevents updating or deleting `v*` release tags.
- [x] Secret scanning, push protection, and validity checks enabled.
- [x] Private vulnerability reporting enabled.
- [x] Dependabot alerts and security updates enabled, with weekly Bun and Actions version updates.
- [x] CodeQL analysis for JavaScript/TypeScript and GitHub Actions.
- [x] Dependency review on pull requests.
- [x] CI runs repository checks, client lint, typecheck, unit tests, production build, and browser tests.
- [x] Release workflow creates a GitHub Release from a `v*.*.*` tag that is on `main`.
- [x] CODEOWNERS routes review to the maintainer.
- [x] Actions use the default read-only token unless a workflow declares a narrower write permission.

## Owner actions

- [ ] Replace the Windows 98 icon set with original or properly licensed artwork before distributing any release.
- [ ] Confirm the provenance and redistribution rights of the supplied wallpaper, or replace it.
- [ ] Confirm that the copyright notice in `LICENSE` names the intended rights holder.
- [ ] Publish the first tagged release and verify the Release workflow on a real tag.
- [ ] Raise the required approval count to one when a second maintainer joins.
- [ ] Review Bun advisories manually: Dependabot covers Bun version updates, not Bun security updates.
- [ ] Consider GitHub Discussions or a project board only if the issue tracker stops being sufficient.

## Verification

Run from the repository root:

```sh
bun install --frozen-lockfile
bun run check
bun run test
bun run check:client
bun run --cwd=client build
```

Inspect the published state:

```sh
gh repo view KavinduNirmal/circa-archive \
  --json defaultBranchRef,description,repositoryTopics,hasWikiEnabled,hasIssuesEnabled

gh api repos/KavinduNirmal/circa-archive/rulesets
gh api repos/KavinduNirmal/circa-archive/private-vulnerability-reporting
gh api repos/KavinduNirmal/circa-archive/actions/workflows
gh run list --limit 10
```

A clean result means:

- GitHub's repository README endpoint returns the root `README.md`, not `.github/ABOUT.md`.
- The default branch is `develop`, and both `main` and `develop` appear in the ruleset.
- The latest CI run on `develop` is green.
- Private vulnerability reporting returns `{"enabled":true}`.
- The issue chooser shows the three issue forms and the contact links for workflow, support, and private security.

## Notes

- The project has no hosted deployment, Pages site, package registry publication, or supported release yet. Add those checks when they exist.
- No coverage threshold is enforced. Tests are behavioral and reviewed for authorization, lifecycle, vote uniqueness, and visibility as those features land.
- GitHub features that require a public repository are documented here; a private mirror would need equivalent rules and scanning configured separately.
