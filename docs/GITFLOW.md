# Branch model and releases

CIRCA Archive uses a gitflow model: `develop` integrates ordinary work, and `main` holds released code. Both branches are protected and accept changes only through pull requests.

## Branches

| Branch | Purpose | Cut from | Merges into |
| --- | --- | --- | --- |
| `main` | Released code and release tags | — | — |
| `develop` | Integration branch and repository default | `main` (initial setup) | — |
| `feature/<topic>` | New behavior or a substantial enhancement | `develop` | `develop` |
| `fix/<topic>` | A defect fix | `develop` | `develop` |
| `docs/<topic>` | Documentation and specifications | `develop` | `develop` |
| `chore/<topic>` | Tooling, dependencies, and maintenance | `develop` | `develop` |
| `release/<version>` | Release preparation | `develop` | `main`, then `develop` |
| `hotfix/<version>` | Urgent fix to a release | `main` | `main`, then `develop` |

Use lower-case, hyphenated topic names: `feature/record-search`, `fix/mail-sort`, `docs/api-contracts`, `release/0.2.0`, `hotfix/0.2.1`.

## Protected branches

`main` and `develop` are covered by repository rulesets:

- Changes arrive through a pull request; direct pushes are rejected.
- Force pushes and branch deletion are blocked.
- Review conversations must be resolved before merging.
- Required status checks must pass: **Repository checks**, **Client checks**, and **Dependency review**.
- `main` requires the branch to be up to date with its base before merging. `develop` does not, so parallel work is not serialized behind every merge.
- The project has one maintainer, so the required approval count is zero. Review conversations must still be resolved and every required check must pass. Raise the approval count to one when a second maintainer joins.

CodeQL analysis and the Playwright end-to-end suite run on every pull request. They are advisory while the browser suite stabilizes; inspect both before merging. Releases are protected by a tag ruleset: tags matching `v*` cannot be updated or deleted.

## Day-to-day flow

```sh
git switch develop
git pull --ff-only
git switch -c feature/record-search

# edit, test, commit
bun run precommit
git push -u origin feature/record-search
```

Open the pull request against `develop`, fill the template, and wait for the required checks. Feature, fix, docs, and chore pull requests are squash-merged so each change is one commit. Delete the remote branch after merging.

If `develop` moves while a pull request is open, rebase the branch on the latest `develop` rather than merging `develop` into it. Do not force-push a branch that someone else is reviewing without agreement.

## Release process

Release branches carry only the version bump, changelog, and final release fixes. Feature work continues on `develop`.

1. Confirm `develop` is green and decide the next semantic version.
2. Create the release branch:

   ```sh
   git switch develop
   git pull --ff-only
   git switch -c release/0.2.0
   ```

3. Update `client/package.json` to the release version, add the dated release section to `CHANGELOG.md`, and update any affected documentation.
4. Commit with an imperative message such as `Prepare 0.2.0 release`, push the branch, and open a pull request against `main`.
5. After the required checks pass, merge with a **merge commit**. Do not squash a release pull request; the merge commit keeps the release history connected.
6. Tag `main` from the merged commit and push the tag:

   ```sh
   git switch main
   git pull --ff-only
   git tag -a v0.2.0 -m "CIRCA Archive 0.2.0"
   git push origin v0.2.0
   ```

7. The [Release workflow](../.github/workflows/release.yml) verifies that the tag is on `main` and creates the GitHub Release with generated notes.
8. Bring the release branch back into `develop` with a pull request so the version and changelog are shared, then delete the release branch.

Tags use the form `vMAJOR.MINOR.PATCH`. Pre-release tags may append a suffix such as `v0.2.0-rc.1`; GitHub marks those as pre-releases. Release notes come from the commit range since the previous tag, so keep pull request titles descriptive.

## Hotfix process

Use a hotfix only for a defect that cannot wait for the next planned release.

1. Create the branch from the released `main`:

   ```sh
   git switch main
   git pull --ff-only
   git switch -c hotfix/0.2.1
   ```

2. Add a regression test, fix the defect, and bump the patch version and changelog.
3. Open the pull request against `main`, pass the required checks, and merge with a **merge commit**.
4. Tag the merge commit as `v0.2.1` and push the tag.
5. Open a second pull request from the hotfix branch into `develop` and merge it, so the fix is present in the next release.
6. Delete the hotfix branch.

## Versioning

- Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Add entries under `Unreleased` as changes land; move them into a dated version when releasing.
- The client package version is the release version. The root package is private repository tooling and is not published.
- No release is currently supported. The first tagged release should be treated as a preview.
