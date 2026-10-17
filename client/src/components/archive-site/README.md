# Public archive

## Responsibility and structure

The full-page reading edition of the archive: the website a visitor uses instead
of the interactive workstation. It is server-rendered, needs no client JavaScript
to read, and carries the same entries as the archive browser.

- `archive-chrome.tsx`: the full-bleed frame — masthead with the search box,
  section bar, site notice, breadcrumbs, and foot. It also carries the one link
  out of the fiction, "About the site", which goes to `/[lang]/meta/about`.
- `site-search.tsx`: the search form. A plain GET form to the index, so a query
  survives a bookmark and works without JavaScript.
- `archive-home.tsx`: the front page — search, a featured record, recent filings,
  most consulted, a random door, organizations, and the workstation invitation.
- `archive-records.tsx`: the index table and the search results page.
- `archive-record.tsx`: one record as a work page. The notes, download, and
  navigation tools sit above the text; the filed notes sit at the foot.
- `archive-organizations.tsx`: the organizations directory.
- `archive-about.tsx`: the reading guide, including the glossaries of classes and
  statuses.
- `archive-data.ts`: the questions these pages ask of the index — consultation
  counts, holdings, adjacency, and a random code. No React.
- `record-prose.tsx`: the server-side Markdown renderer. It runs the same pipeline
  as the viewer and turns the tree into React elements, with redactions as native
  `<details>` and missing figures as plates.
- `archive-site.module.css`: the full-page stylesheet. Full-bleed chrome, a wide
  reading grid, steel panels, and paper sheets. No gradients; depth is a bevel.

## Boundaries

The archive is fiction; the project page is not. This folder never explains that
the Commission is invented — `../meta/` owns that — and the "About the site"
button is the only door between them. The pages read from the index, the record
service, and the correspondence fixtures; they never invent a record, a citation,
or a note. Downloads are generated from the authored Markdown through the same
pipeline as the reader, and a held filing has no download at all.

## Usage and verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`.
`tests/archive-site.test.tsx` covers the chrome and its search, the front page
sections, the index and server search, record pages (including a sealed section
and a held filing), the action bar, notes, downloads and the refused download,
the organizations and guide, the project page, and link integrity in both
languages. The routes live in `../../app/[lang]/site/`.
