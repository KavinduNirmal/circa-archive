# CIRCA Archive

A collaborative ghost-story archive presented as a fictional desktop workstation. C.I.R.C.A. (Commission for Incident Review and Corrective Action) files anomalous incidents, exploration records, and organization dossiers in a shared universe.

## Project status

**Pre-production.** This repository contains product specifications, contributor tooling, and a Next.js frontend. The frontend serves a public landing page and a CIRCA/OS workstation preview over illustrative fixtures: the archive browser, the mail client, the file browser, and the record editor all work, and none of them is connected to a service. No backend, supported release, or deployment exists yet, so the technical choices in [ARCHITECTURE.md](ARCHITECTURE.md) remain drafts.

The planned stack is Next.js and React for the public interface, .NET 10 Minimal APIs with EF Core for the backend, PostgreSQL for persistence, SignalR for live updates, and S3-compatible storage for evidence.

## Repository layout

| Path | Purpose |
| --- | --- |
| [client/](client/README.md) | Next.js, React, and Tailwind interface: the public site and the CIRCA/OS workstation |
| `backend/` | Reserved for API and persistence services |
| `admin/` | Reserved for administration tooling |
| `docs/lore/` | Reserved for setting documentation |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Draft architecture, schema, and API contracts |
| [Project context](.agents/brain/PROJECT_CONTEXT.md) | Product direction and mechanics |
| [Design specification](.agents/brain/DESIGN.md) | Visual language and interface rules |
| [.agents/rules/](.agents/rules/README.md) | Agent development policies |
| [scripts/](scripts/README.md) and [tests/](tests/README.md) | Repository checks and Bun tests |
| [.husky/](.husky/README.md) | Pre-commit checks |
| [.github/](.github/README.md) | Issue and PR templates |

Empty directories may not appear in a fresh clone; Git tracks files rather than directories.

## Getting started

Read the project context and architecture, then consult [CONTRIBUTING.md](CONTRIBUTING.md). Install Bun 1.3.14 and initialize repository tooling:

```sh
bun install --frozen-lockfile
bun run prepare
bun run check
bun run test
```

Install client dependencies with `bun install --frozen-lockfile` from `client/`. Start the empty scaffold with `bun run --cwd=client dev`. See [client setup](client/README.md) for lint, typecheck, tests, and production builds.

Husky runs staged README and whitespace checks, tooling tests, and frontend lint/typecheck/tests before commits. Every authored folder needs its own README; stage documentation alongside code. Generated folders are excluded.

`.env.example` is an empty placeholder; no environment variables are required for these checks or the frontend scaffold.

Useful early contributions include clarifying conflicting requirements, refining API contracts, improving accessibility plans, and proposing application scaffolding with reproducible setup instructions.

## Project principles

- Keep the desktop interface within the fiction.
- Store stable entity IDs; display readable archive codes.
- Render record Markdown as paper-like documents; fictional `.pdf` names do not require PDF generation.
- Preserve author credit and allow multiple story continuities.

## Community and licensing

Use the repository's issue templates for bugs, proposals, and documentation changes. Read the [contribution guide](CONTRIBUTING.md), [code of conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md) before participating. Maintainers can use the [publishing checklist](docs/OPEN_SOURCE_CHECKLIST.md) when setting up GitHub.

Repository code and accompanying documentation are available under the [MIT License](LICENSE). Contributions must be original or compatible with that license. Referenced third-party works remain the property of their respective owners; future hosted user content will need its own explicit policy.
