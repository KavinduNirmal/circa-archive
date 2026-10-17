# GitHub collaboration

## Responsibility

Own the repository's GitHub-facing automation and collaboration templates: continuous integration, security analysis, dependency updates, issue and pull request forms, and review routing.

## Structure

- `workflows/`: CI, CodeQL, dependency review, and release automation.
- `ISSUE_TEMPLATE/`: bug, feature, and documentation forms plus chooser configuration.
- `PULL_REQUEST_TEMPLATE.md`: change context, verification, and contributor checklist.
- `dependabot.yml`: weekly Bun and GitHub Actions updates against `develop`.
- `CODEOWNERS`: review routing for repository and policy files.
- `ABOUT.md`: this folder's documentation.

## Why this folder has no README.md

GitHub renders `.github/README.md` as the repository README, ahead of the root `README.md`. One here would replace the project introduction with these folder notes. This file is the folder documentation instead, and `scripts/check-repository.ts` rejects a `.github/README.md` so the problem cannot return.

## Boundaries and verification

Keep GitHub collaboration configuration here; community policy and project documentation belong in the repository root and `docs/`. Workflows must use the Bun version declared by the project, run on `main` and `develop`, and avoid secrets. Validate workflow YAML before pushing, then confirm the checks appear on a pull request. See `../docs/GITFLOW.md` for the branch model and `../docs/OPEN_SOURCE_CHECKLIST.md` for repository settings.
