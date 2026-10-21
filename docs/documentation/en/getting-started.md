# Getting started

From a clean clone to a local build of the archive, in the order the checks run.

## Requirements

Bun runs the root tooling and the frontend. Next.js supplies the rest; the browser tests are optional.

- Bun 1.3.14 — packages, scripts, and the lockfiles.
- Node.js 20.9 or newer — required by Next.js.
- .NET 10 SDK and Docker — for the backend modular monolith and PostgreSQL database under backend/.
- Chromium — only for the Playwright suite.
- Git, and a clone of the repository.

> [!NOTE]
> Two installs, one toolchain
>
> The repository root and client/ each have their own package.json and lockfile. Install both; the pre-commit hook runs both.

## Install

Fork and clone, then install at the root and in the client. Both lockfiles are committed, so use the frozen lockfile.

```sh
git clone <repository>
cd circa
bun install --frozen-lockfile
bun run prepare
cd client && bun install --frozen-lockfile
```

bun run prepare installs the Husky hooks. A commit then checks staged READMEs, repository tooling, lint, types, and the unit suite before it lands.

## Run it locally

Start the development server from client/. It serves port 3001; the proxy redirects bare paths to the reader's language.

```sh
bun run --cwd=client dev
# http://localhost:3001 -> /en
```

| Route                    | Surface                                  |
| ------------------------ | ---------------------------------------- |
| `/en`                    | Public portal, in the Commission's voice |
| `/en/site`               | Reading edition of the archive           |
| `/en/meta`               | Project landing page                     |
| `/en/meta/documentation` | This documentation                       |
| `/en/desktop`            | Workstation preview                      |

A production build is bun run --cwd=client build, then bun run --cwd=client start.

To build the backend solution or launch the local PostgreSQL database:

```sh
# Start local backing database
docker compose -f backend/docker-compose.yml up -d circa-db

# Build the backend solution
dotnet build backend/Circa.sln
```

## Verify a change

Run the checks you touched. Before a pull request, precommit is the full pass.

```sh
bun run check        # every authored folder has a README
bun run test         # root tooling tests
bun run check:client # lint, typecheck, unit tests
bun run precommit    # all of the above, staged first
```

> [!NOTE]
> Report what actually ran
>
> The pull request template asks for verification. Name the commands that passed and the ones that could not run; do not report a suite you did not execute.

## When something will not run

Three failures account for most local setup problems.

- A read-only Bun cache in a sandbox: set BUN_TMPDIR to a writable directory and pass --cache-dir on install.
- Port 3001 already occupied: stop the other server. Playwright reuses an existing server when one is configured.
- Missing Chromium: run bunx playwright install chromium, and set PLAYWRIGHT_BROWSERS_PATH when its cache is not writable.

If a page prints a message key instead of a sentence, the catalog is missing that key in that language. i18n-messages.test.ts is the test that catches it.
