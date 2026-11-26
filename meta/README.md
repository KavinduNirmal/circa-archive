# CIRCA project website

## Responsibility

Independent static Astro website for the project introduction, public documentation, project/team information, existing terms and licences, and sponsorship. The public archive, workstation, accounts, and API remain in [client](../client/README.md) and [backend](../backend/README.md).

## Structure

- `src/layouts/`: the local-font document shell, responsive navigation and footer.
- `src/components/`: editorial page compositions and the documentation reader.
- `src/lib/`: the explicit public registry, local Markdown loader, safe rendering, origins and localized destinations.
- `src/routes/`: route modules registered explicitly in `astro.config.mjs`. They are outside Astro's default pages directory so mandatory folder READMEs never become public routes.
- `src/scripts/`: progressive enhancements for menus, session-scoped chapter choices, lazy search and clipboard feedback.
- `src/styles/`: the near-black, bone and ember editorial system.
- `messages/`: English and Korean project copy. Shared lore and the author guide stay in English, with a language notice.
- `public/`: the supplied project seal and locally served GitHub contributor portraits. The allowlisted lore diagram is generated from its existing public repository source.
- `tests/` and `e2e/`: Vitest content contracts and Playwright browser scenarios.
- `Dockerfile`, `Dockerfile.dockerignore`, `nginx.conf`: explicit public build inputs and static Nginx serving. The [gateway](../infra/README.md) manages the two origins.

## Development and verification

Use Node.js 24 and Bun 1.3.14. Install separately from root/client tooling:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

Development and preview use port 4321. Browser tests run the built site, start preview when necessary, and require Chromium (`bunx playwright install chromium`). Set `PLAYWRIGHT_BROWSERS_PATH` when using a local browser installation. Astro's `--ignore-lock` keeps Playwright's preview in the foreground even in an agent environment.

The content collection reads only registered documents from `../docs/documentation/`, the public lore files, and `../docs/AUTHOR_GUIDE.md`. It fails the build if a registered article is missing. Edit both language files for technical documentation. Add a topic in `src/lib/registry.ts`; never replace the registry with a recursive repository glob. Private notes, ignored lore, and folder READMEs outside the registered public lore index are excluded. Restart development after editing article sources; publishing requires rebuilding and deploying. There is no runtime GitHub fetch, server adapter, account transport or analytics on this site.

`PROJECT_SITE_ORIGIN` (default `http://localhost:4321`) controls canonical URLs. `ARCHIVE_SITE_ORIGIN` (default `http://localhost:3001`) controls archive/workstation links. Both must be HTTP(S) origins. `PROJECT_REPOSITORY_URL`, `PROJECT_SPONSOR_URL`, and `PROJECT_CONTACT_URL` override public destinations. `PROJECT_DOCUMENTATION_REF` selects the GitHub source/edit ref (default `develop`), not the content loaded into a build. Last-updated dates come from available local Git history and are omitted when unavailable, including Docker builds without Git metadata. All these settings are build-time inputs; rebuild after changing them. Use only placeholders in `.env.example`.

## Deployment and compatibility

The root Compose project serves the project at `http://project.localhost:3001` and the archive at `http://localhost:3001`. Configure both origins explicitly if changing the published port. Nginx derives hostnames from those origins. Root `/` redirects to English; language links retain the current page. Each app owns its own locale configuration; tests assert language parity.

Legacy locale-prefixed meta URLs redirect at Nginx and direct Next entry points. The project page provides legacy fragment targets and an enhancement that follows relocated team, support, terms, contribution and build sections. Ordinary links remain available without JavaScript. Unknown routes return 404 rather than the homepage. Hash-named assets are immutable; HTML, Markdown and search indexes revalidate.

Build and verify the replacement before updating live routing. Keep the previous static image, Next image and gateway configuration for rollback. No database migration, DNS change, TLS purchase or live deployment is part of local development. See the [decision](../docs/adr/0002-project-website.md).

## Editorial identity

The publication is a quiet essay on near-white archival paper with burnt-orange ink: Instrument Serif display, IBM Plex Sans reading copy, IBM Plex Mono annotations, long intervals, an offset reading column, a mono source note in the margin, and a fixed peripheral bitmap dot field that fades before the prose. The top bar is a flat 60px strip of mono links following the selected study's navigation, retaining the site's Home, Documentation, About, Sponsor, Enter-the-archive and language structure. A single 1px rule and whitespace replace cards; the seal is printed small rather than used as a hero plate.

The landing page opens on the question "What determines the truth from untruth?", marked "an empty project" in the far corner, then moves through the limits of understanding, witnessing, the fiction, both editions, the documentation index, and the build register. The four starting points are a ruled index rather than a card grid, and the licence and stack line is plain underlined text. The library plate is a supplied local image; the rest of the page remains rule, type, and margin.

Search is deliberately documentation-only: it appears in the reader's sidebar, and the keyboard shortcut does nothing elsewhere. Only documentation uses breadcrumbs; its chapter groups remain collapsible and mobile readers get the search field before a compact chapter disclosure. The team register uses a small shadcn/Radix React island; all other page compositions remain Astro. Portraits are checked-in public GitHub copies with provenance in `public/portraits/README.md`, so visiting or building the site does not request external portraits. Support includes Buy Me a Coffee and the configured GitHub Sponsors destination.

The stylesheet is split into tokens, base, layout, editorial, prose, documentation and print modules imported by `src/styles/site.css`; see [the style guide](src/styles/README.md). `e2e/identity.spec.ts` verifies the editorial contracts and `e2e/website.spec.ts` captures all six page types at four widths in both languages, including search scope and no-JavaScript navigation. See [the decision record](../docs/adr/0002-project-website.md) and [design documentation](../docs/documentation/en/design.md).
