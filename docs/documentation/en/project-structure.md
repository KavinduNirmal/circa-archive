# Project structure

Where the routes, the components, the copy, and the corpus actually live.

## The tree

The repository is a small monorepo with one built surface and two reserved ones. Read the top level before the client: most confusion about this project comes from searching the wrong tree.

```text
circa/
├── client/           the Next.js interface
├── backend/          reserved for .NET services
├── admin/            reserved for administration
├── docs/             planning and the open-source checklist
├── scripts/          repository checks
├── tests/            root tooling tests
├── ARCHITECTURE.md   draft platform design
└── .agents/brain/    product context and design specification
```

Reserved folders may be absent from a fresh clone; Git tracks files, not directories.

## Inside client/

The client has three surfaces, each with its own component folder, stylesheet, and README.

- components/archive-site/ — the reading edition: server-rendered pages, search, records, and downloads.
- components/ — the workstation shell and its five application windows.
- components/meta/ — the project landing page, the dossier, and this documentation.
- components/ui/ — shadcn-style primitives shared by the client surfaces.
- lib/markdown/ — the record renderer. No React, no DOM.

A route under app/[lang] composes: it resolves the language, sets the request locale, builds metadata, and renders a component. Copy and layout do not live in the route file.

## Two kinds of content

What is translated and what is not is a product decision, not an accident.

| Kind | Lives in | Translated? |
| --- | --- | --- |
| Interface chrome | `messages/<locale>/*.json` | Yes |
| Filed records | `*-index.ts, *-sources.ts` | No |
| Project pages | `messages/<locale>/meta.json` | Yes |
| Documentation articles | `docs/documentation/<locale>/*.md` | Yes |
| Identifiers | code and data modules | No |

An archive does not translate a document that was filed in English. The catalog test keeps the two languages aligned, and the archive's own guide explains the gap to a reader.

## The README rule

Every authored folder has a README stating what it owns, how it is organised, its boundaries, and how it is verified. bun run check fails when a folder is added without one.

Stage the README with the code. The pre-commit hook checks staged paths, so an unstaged README does not count.
