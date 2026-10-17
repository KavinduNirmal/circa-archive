# Changelog

All notable changes to CIRCA Archive are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Continuous integration for repository checks, client lint, typecheck, unit tests, production build, and Playwright browser tests against that build.
- CodeQL analysis for JavaScript/TypeScript and GitHub Actions, plus dependency review on pull requests.
- Weekly Dependabot updates for Bun dependencies and GitHub Actions.
- `CODEOWNERS`, a release workflow, issue contact links, and a support guide.
- Gitflow branch model, release checklist, hotfix procedure, and protected `develop` and `main` branches.
- A root asset notice covering the Windows 98 icon set, the supplied wallpaper, fonts, and shadcn/ui primitives.

### Changed

- `develop` is the default branch; contributions arrive through pull requests.
- The README and contributor, security, and conduct policies were rewritten for public contributors.
- Repository checks now reject `.github/README.md` and document its replacement in `.github/ABOUT.md`.
- Local-only scratch and planning files are excluded from the published tree and ignored per clone.

### Fixed

- GitHub now renders the project README instead of the `.github` folder notes.
- Desktop tooltips close when the pointer leaves a shortcut instead of lingering in Radix's hoverable-content area.
- The browser suite uses the current window, taskbar, and tooltip controls, so all seventeen browser tests pass again.
- The client browser tests publish an HTML report for failed CI runs.

## [0.1.0] - Unreleased

The initial public scaffold: the Next.js public archive, project pages, and CIRCA/OS workstation over illustrative fixtures. No supported release has been tagged.
