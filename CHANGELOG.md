# Changelog

All notable changes to CIRCA Archive are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - Unreleased

Development milestone covering authentication and local full-stack operation.
The client package is versioned at 0.2.0; this milestone has not been tagged or
published as a supported release.

### Added

- A .NET 10 modular-monolith Auth module with PostgreSQL account persistence, Identity password hashing, JWT access tokens, rotating HttpOnly cookie sessions, and server-side authorization policies.
- Localized sign-up, sign-in, and account pages, server-verified account navigation, and same-origin authentication transport in the Next.js client.
- Analyst profiles with UUIDv7 account IDs, unique nine-digit display IDs, generated name previews, fictional display email, moderation state, lifecycle timestamps, and bounded login IP history.
- A pinned 542-entry reserved username blocklist, with case-insensitive exact matching, upstream attribution, and its MIT license notice. Content flagging remains deferred.
- Root Docker Compose setup for the Next.js development server, API, and PostgreSQL, with persistent database and Data Protection key volumes, local environment configuration, and a frontend-to-API health check.
- Opt-in fresh-database initialization restricted to Development, with tests for restart persistence, disabled initialization, and rejection outside Development.
- A transactional SQL upgrade and recovery instructions for existing pre-profile auth databases.
- Continuous integration for repository checks, client lint, typecheck, unit tests, production build, and Playwright browser tests against that build.
- CodeQL analysis for JavaScript/TypeScript and GitHub Actions, plus dependency review on pull requests.
- Weekly Dependabot updates for Bun dependencies and GitHub Actions.
- `CODEOWNERS`, a release workflow, issue contact links, and a support guide.
- Gitflow branch model, release checklist, hotfix procedure, and protected `develop` and `main` branches.
- A root asset notice covering the Windows 98 icon set, the supplied wallpaper, fonts, and shadcn/ui primitives.

### Changed

- New registrations require 3–20 ASCII letters/digits/underscores and passwords containing uppercase, lowercase, a digit, and a symbol. Normalized username/email uniqueness is enforced in PostgreSQL, including concurrent registrations.
- Five strikes ban an account; inactive, banned, soft-deleted, and temporarily restricted accounts are checked across login, refresh, and protected session access.
- Project pages, bilingual documentation, and architecture notes distinguish implemented authentication from fixture-backed archive content and planned administration tooling.
- Backend container builds restore and publish the API and its references without including test projects. The backend Compose entry point now includes the root stack.
- The client package version is 0.2.0. Release tagging and publication still follow the separate release process.
- `develop` is the default branch; contributions arrive through pull requests.
- The README and contributor, security, and conduct policies were rewritten for public contributors.
- Repository checks now reject `.github/README.md` and document its replacement in `.github/ABOUT.md`.
- Local-only scratch and planning files are excluded from the published tree and ignored per clone.
- Removed a conflicting default ruleset so the project branch rules are the single source of truth; linked the asset licensing work to its tracking issue.

### Fixed

- The local container API publishes port 5040, matching the host-run frontend default; the containerized frontend uses `http://circa-api:8080` for server requests and same-origin API rewrites.
- Local API startup receives the required auth settings and can initialize a fresh database, allowing the Compose stack to support account registration and sign-in.
- GitHub now renders the project README instead of the `.github` folder notes.
- Desktop tooltips close when the pointer leaves a shortcut instead of lingering in Radix's hoverable-content area.
- The browser suite uses the current window, taskbar, and tooltip controls, so all seventeen browser tests pass again.
- The client browser tests publish an HTML report for failed CI runs.

## [0.1.0] - Unreleased

The initial public scaffold: the Next.js public archive, project pages, and CIRCA/OS workstation over illustrative fixtures. No supported release has been tagged.
