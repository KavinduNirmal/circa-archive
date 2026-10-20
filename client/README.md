# CIRCA frontend

## Responsibility

The client package is versioned at **0.2.0**, an unreleased development milestone. See the [changelog](../CHANGELOG.md) and [release process](../docs/GITFLOW.md#release-process) for the distinction between a package version and a published release.

Next.js frontend serving a public landing page, a full-page public archive, and the CIRCA/OS workstation in English and Korean. Every page lives under a language segment — `/{lang}`, `/{lang}/site`, `/{lang}/meta`, `/{lang}/meta/about`, `/{lang}/meta/documentation`, `/{lang}/desktop`, `/{lang}/desktop/{destination}`, and `/{lang}/desktop/record/{code}` — and a bare path is redirected to the reader's language. The landing page is a dense institutional portal: public notices, filing procedures, organization particulars, credential status, and a prominent archive entry. The archive is the reading edition of the same records: search-first, server-rendered, and readable without JavaScript, with record pages, an organizations directory, a guide, notes, and downloadable copies. The project layer outside the fiction describes what the archive is: a landing report, a dossier, and a documentation set. Its copy and metadata remain in the Commission's voice, in whichever language the request resolved to. The workstation answers the arrival with a post screen, then runs shortcut navigation, draggable and resizable destination windows, a Start launcher, taskbar, emblem wallpaper, and a switchable CRT overlay. Its desktop URLs are workspace positions — a destination or a record can be linked, Back and Forward move focus, and a refresh restores the tab's windows from session storage — while `/{lang}/site/records/{code}` stays the canonical public address. Every desktop destination opens a real screen over illustrative preview data: Search the archive browser, Inbox the mail client, each folder the file browser, CIRCA Word the Markdown record editor, and a record the record [reader](src/components/reader/README.md). The authentication backend lives under `../backend/`; sign-up, sign-in, and personal access are integrated with the cookie API, while archive/workstation records continue to read local fixtures. See the [auth transport guide](src/lib/auth/README.md) for configuration and browser verification.

## Structure and boundaries

- `src/app/`: routes under the `[lang]` segment, the global theme, the `(workspace)` group that keeps the workstation shell mounted across desktop URLs, and [desktop design decisions](<src/app/[lang]/(workspace)/desktop/README.md>).
- `src/i18n/`: locale routing, catalog loading, and locale-aware navigation; see its [README](src/i18n/README.md).
- `messages/`: one catalog per language; see its [README](messages/README.md).
- `src/components/`: desktop shell, the shared language switcher, the public [site](src/components/site/README.md) and post screen, the public [archive](src/components/archive-site/README.md), the [project surface](src/components/meta/README.md), the archive [browser](src/components/browser/README.md), the [mail client](src/components/mail/README.md), the [file browser](src/components/files/README.md), the record [editor](src/components/word/README.md) and [reader](src/components/reader/README.md), reusable navigation and icons, and shadcn/ui primitives.
- `src/components/auth/`: the [archive-themed registry access pages](src/components/auth/README.md) and server-verified portal/archive navigation.
- `src/lib/`: shared class-composition helper, the record [Markdown renderer](src/lib/markdown/README.md) the reader and the `.txt` export share, and the workstation's pure destination, window, and trail contracts.
- `src/stores/`: the workstation [store](src/stores/README.md) and its provider — open windows, focus, geometry, the reader trail, and the CRT preference.
- `src/proxy.ts`: the request-time language decision — path prefix, then cookie, then `Accept-Language`, then English.
- `tests/`: Vitest interaction and utility tests, including the store, the URL mapper, and the URL adapter.
- `e2e/`: responsive Playwright desktop, deep-link and history, and language tests.
- `scripts/`: generators that write tracked files, currently the record corpus; see its [README](scripts/README.md).
- `public/`: supplied emblem wallpaper, the published [record corpus](public/Ghost_story.md), and the Windows 98 shortcut [icon set](public/icons/README.md).

## Localization

`src/i18n/routing.ts` is the only file that lists languages; adding one means editing it and adding a catalog directory under `messages/<locale>/`, one file per namespace. Copy is never written into a component.

The split is deliberate and is the thing to understand before translating anything:

- **Interface chrome is translated.** The workstation shell, the post screen, the language control, the public portal, and the interior of all five application windows — the archive browser, the mail client, the file browser, the record editor, and the record reader — read every menu, button, label, status line, notice, and empty state from the catalogs.
- **Filed content is not.** The archive index, the incident titles, the record corpus, the mail fixture, and the file tree are the fiction's filed documents, and an archive does not translate a document that was filed in English. They live in the `*-index.ts`, `*-sources.ts`, `*-correspondence.ts`, and `ghost-story.ts` modules and stay byte-identical in both languages. One of them is asserted byte-identical to `public/Ghost_story.md`.
- **Brand names and identifiers are not.** `CIRCA`, `CIRCA/OS`, `CIRCA Explorer`, `CIRCA Word`, `CIRCA Reader`, `Titan Browser`, and `Titan Mail` are proper nouns, and archive codes, document numbers, dates, and version strings must survive translation intact because they are how a record is cited.

`tests/i18n-messages.test.ts` holds the catalogs against each other — the same namespace files, identical key sets, no empty values, the same ICU `{placeholders}` and rich-text tags — and `tests/i18n-windows.test.tsx` opens each application window in Korean and asks it for a word from its own namespace, so a window that was never wired cannot pass. Known gaps are recorded in the per-app READMEs: the archive's internal search still matches the English class and status words, and the reader's relative timestamps stay English.

Windows are positioned elements with pointer-driven drag and corner resize; the shell owns geometry, stacking, minimize, and maximize. `react-rnd` is still installed but unused, kept only so a future pass can evaluate it without a reinstall. Domain rules and API authorization belong in `../backend/`.

## Development and verification

Use Bun 1.3.14 and Node.js 20.9 or newer. From `client/`:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
bun run test:e2e:auth
bun run sync:corpus
```

In this sandbox Bun's own cache and temp directories fall outside the writable workspace, so a plain `bun install` fails; prefix it with `BUN_TMPDIR=/tmp` and add `--cache-dir=<workspace>/.dsh-scratch/bun-cache` if the global cache is read-only.

`public/Ghost_story.md` is the published record corpus and the file to edit. The reader cannot read a file from the browser bundle, so `src/components/reader/ghost-story.ts` carries the same bytes as data; run `bun run sync:corpus` after editing the published copy. `bun run test` fails if the two drift apart.

Development serves http://localhost:3001. `bun run start` serves a production build. Browser tests require Chromium (`bunx playwright install chromium`; set `PLAYWRIGHT_BROWSERS_PATH` to a writable directory when the default cache is read-only) and use port 3001.

## Theme

The interface uses steel-blue surfaces, hard corners, and bevels. The supplied image controls desktop composition. The global screen overlay is pointer-transparent and can be disabled using CRT in the taskbar. DM Sans and IBM Plex Mono are bundled locally, plus Libre Baskerville for the archive masthead's wordmark alone; none carries Hangul, so `:lang(ko)` names the Korean faces to fall back to rather than letting each platform choose. Whether to bundle a Korean webfont instead remains an open question.

See [third-party notices](THIRD_PARTY_NOTICES.md) and the root [asset notice](../NOTICE) for copied component and asset licensing. Every new authored folder needs a README.

## Repository documentation

The project manual reads English and Korean Markdown from the public GitHub
repository with five-minute Next.js caching. See
[the source guide](../docs/documentation/README.md) for authoring, Git ref
overrides, publishing, global search, and source actions.

## Low-resource verification

Run checks sequentially. Unit tests accept `bun run test -- --maxWorkers=1` or a selected file list. For a production build with one page worker, use `CIRCA_LOW_RESOURCE=1 RAYON_NUM_THREADS=1 bun run build`. The auth browser suite already limits worker concurrency; do not run it alongside a production build on a constrained machine.

## Local Docker

The root [Compose setup](../README.md#run-locally-with-docker) builds this folder
using Node 24 and Bun 1.3.14 with the frozen lockfile. `.dockerignore` excludes
host dependencies, Next output, test artifacts, and local environment files.
Source is copied into the image; rebuild after edits. No host `.next` or
`node_modules` directory is mounted into the container.

The website serves port 3001. Compose sets server-only
`API_ORIGIN=http://circa-api:8080`; existing development rewrites forward browser
`/api/*` calls there. Direct `bun run dev` defaults to `http://localhost:5040`,
matching the Compose API's published port. Browser code never uses a Docker
service hostname. The client health check requests `/api/v1/` through Next to
verify the frontend-to-backend route.
