# Building

The project website is an independent static Astro application. The public archive and CIRCA/OS workstation remain in Next.js; accounts and sessions use the .NET backend.

## Run the project website

Use Node.js 24 and Bun 1.3.14. From the repository root:

```sh
bun install --cwd meta --frozen-lockfile
bun run --cwd meta dev
```

The project website listens on port 4321. Documentation reads the checked-out public Markdown; edit it locally and restart the development server to refresh the content collection. Publish a new static build to make changes visible to readers.

## Verify a change

```sh
bun run check
bun run check:meta
bun run --cwd meta build
bun run --cwd meta test:e2e
```

Run `bun run check:client` for changes to the archive or workstation. The [Testing](testing.md) guide covers client verification. The meta and infrastructure READMEs describe browser and real Nginx checks.

## Explore the implementation

Read [Getting started](getting-started.md), [Rendering](rendering.md), [Routes](routes.md), and [Design](design.md). Project documentation uses a safe documentation renderer; fictional record rendering remains a separate Next.js concern.

## Run both origins

Docker Compose uses Nginx to send `project.localhost:3001` to the static project service and `localhost:3001` to the archive. API requests on the archive origin go to the backend. Configure `PROJECT_SITE_ORIGIN` and `ARCHIVE_SITE_ORIGIN` together when changing domains or ports.
