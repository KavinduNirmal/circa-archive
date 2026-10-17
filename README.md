# CIRCA Archive

[![CI](https://github.com/KavinduNirmal/circa-archive/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/KavinduNirmal/circa-archive/actions/workflows/ci.yml)
[![CodeQL](https://github.com/KavinduNirmal/circa-archive/actions/workflows/codeql.yml/badge.svg?branch=develop)](https://github.com/KavinduNirmal/circa-archive/actions/workflows/codeql.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-2f6f6a)](LICENSE)

CIRCA Archive is a collaborative ghost-story archive presented as a fictional desktop workstation. The Commission for Incident Review and Corrective Action (C.I.R.C.A.) files anomalous incidents, exploration records, and organization dossiers in a shared universe.

The project has two public faces. The **archive** is a server-rendered reading edition: search-first, readable without JavaScript, with record pages, an organizations directory, a guide, notes, and downloadable copies. The **workstation** is a period desktop for the same world: draggable and resizable windows, a Start menu, a taskbar, an emblem wallpaper, and a switchable CRT overlay. Its browser, mail client, file browser, record editor, and record reader all work over illustrative fixtures.

<p align="center">
  <img src="docs/portal.webp" alt="The public archive portal, with search, filters, a featured record, and the register" width="49%">
  <img src="docs/workstation.webp" alt="The CIRCA/OS workstation, with desktop shortcuts, the emblem wallpaper, and the taskbar" width="49%">
</p>

## Project status

CIRCA Archive is in pre-release development. The Next.js frontend is implemented and runs entirely over local fixtures. No backend, hosted deployment, or supported release exists yet, and the .NET/PostgreSQL design in [ARCHITECTURE.md](ARCHITECTURE.md) remains a draft.

## What is in the repository

- **Public archive.** A reading edition with server-rendered record pages, organization dossiers, search, notes, and Markdown-derived downloads.
- **CIRCA/OS workstation.** A windowed desktop shell with five working applications over archive fixtures.
- **Bilingual interface.** English and Korean catalogues, locale-aware routing, and a language switcher that preserves the current page. Filed content stays in the language it was filed in.
- **Record renderer.** A shared Markdown pipeline for frontmatter, tables, redactions, references, and paper-like reading.
- **Verification.** Vitest unit and interaction tests, Playwright browser tests, repository checks, and GitHub Actions on every pull request.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Tooling | Bun 1.3.14, ESLint, Vitest, Playwright |
| Planned backend | .NET 10 Minimal APIs, EF Core, PostgreSQL, SignalR, S3-compatible storage |

## Repository layout

| Path | Purpose |
| --- | --- |
| [client/](client/README.md) | Next.js application: public archive, project pages, and CIRCA/OS workstation |
| [backend/](backend/README.md) | Reserved for the API and persistence services |
| [admin/](admin/README.md) | Reserved for administration tooling |
| [docs/](docs/README.md) | Branch model, publishing checklist, and setting documentation |
| [scripts/](scripts/README.md) | Repository README and whitespace checks |
| [tests/](tests/README.md) | Bun tests for repository tooling |
| [.github/](.github/ABOUT.md) | Workflows, issue and pull request templates, and review routing |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Draft architecture, schema, and API contracts |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes and release notes |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution workflow and verification requirements |
| [SECURITY.md](SECURITY.md) | Private vulnerability reporting and contributor security practices |
| [SUPPORT.md](SUPPORT.md) | Where to ask questions and report problems |
| [NOTICE](NOTICE) | Third-party asset licensing |
| [LICENSE](LICENSE) | MIT license for original code and documentation |

Empty placeholder folders may not appear in a fresh clone; Git tracks files rather than directories.

## Getting started

Install Bun 1.3.14 and Node.js 20.9 or newer. From the repository root:

```sh
bun install --frozen-lockfile
bun run prepare
bun run check
bun run test
```

Install the frontend separately and start the development server:

```sh
cd client
bun install --frozen-lockfile
bun run dev
```

The application serves <http://localhost:3001>. A bare path redirects to the reader's language, then to the public portal.

Useful checks:

```sh
bun run check:client                  # frontend lint, typecheck, and unit tests
bun run --cwd=client build            # production build
cd client && bun run test:e2e         # Playwright browser tests
```

Playwright needs Chromium: `cd client && bunx playwright install chromium`.

Husky runs the staged repository checks, tooling tests, and frontend checks before a commit. `bun run precommit` reproduces them. Every authored folder needs a `README.md` describing its responsibility, structure, boundaries, and usage; `bun run check` enforces this. `.github` uses `ABOUT.md` because GitHub treats `.github/README.md` as the repository README.

## Branching and releases

`develop` is the default integration branch. `main` holds released code. Work happens on short-lived branches such as `feature/record-search`, `fix/mail-sort`, or `docs/api-contracts`, and reaches `develop` through a pull request. Releases use `release/<version>` and hotfixes use `hotfix/<version>`; both merge to `main` and are tagged `v<version>`.

The full branch model, protection rules, release checklist, and hotfix procedure are in [docs/GITFLOW.md](docs/GITFLOW.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request. Use the issue forms for bugs, proposals, and documentation gaps. Report vulnerabilities privately through [SECURITY.md](SECURITY.md), never in a public issue.

Good early contributions include clarifying conflicting requirements, refining the draft API contracts, improving accessibility, and adding reproducible application scaffolding.

## License and third-party assets

Original source code and documentation are available under the [MIT License](LICENSE). Contributions must be original or compatible with that license.

Some visual assets are not MIT-licensed:

- The Windows 98 shortcut icons in `client/public/icons/` are Microsoft artwork used as placeholder shell art. Replace or license them before distributing a release.
- The supplied government-emblem wallpaper has not been cleared for redistribution. Treat it as excluded from the MIT grant until its provenance and license are confirmed.
- Bundled fonts and the shadcn/ui primitives retain their own licenses.

Read [NOTICE](NOTICE) and [client/THIRD_PARTY_NOTICES.md](client/THIRD_PARTY_NOTICES.md) before redistributing the project or any bundled asset.
