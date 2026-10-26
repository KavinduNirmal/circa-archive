# Public archive routes

## Responsibility

The full-page reading edition's routes. Each file resolves the reader's language,
sets the request locale, builds route metadata, and renders a component from
`../../../../components/archive-site/`. No page holds copy or layout.

## Structure

- `page.tsx`: the archive home.
- `layout.tsx`: loads the edition's own faces (Instrument Serif display, IBM Plex
  Sans reading) for this route subtree only.
- `records/page.tsx`: the index, with the `?q=` search read from `searchParams`
  and filtered on the server.
- `records/incidents/page.tsx`, `records/explorations/page.tsx`,
  `records/evidence/page.tsx`: one record class each, rendered by the shared
  type page.
- `records/rumours/page.tsx`, `records/playlists/page.tsx`: reserved addresses
  named in the section bar, explaining why the reading edition serves no index
  of them yet.
- `records/[code]/page.tsx`: one record, prerendered for every code in the
  index; an unknown code is a 404.
- `records/[code]/download/route.ts`: the Markdown and plain-text copies of a
  released filing, and a 404 for a held one.
- `organizations/page.tsx`, `about/page.tsx`: the directories and the guide.
- `characters/page.tsx`: the reserved character directory; dossiers open at
  `characters/[code]/page.tsx` where the API holds them.
- `random/page.tsx`: redirects to a randomly chosen record on each request.
- `write/page.tsx`: the author landing, handing the client island its copy and
  listing creation actions and the browser-local draft.

## Boundaries

The archive is reached at `/{lang}/site`; the public portal stays at `/{lang}`
and the workstation at `/{lang}/desktop`. The project page is `/{lang}/meta`
and is the only route here that leaves the fiction. Record content is not
translated — the filings are English documents and stay so in Korean.

- `write/editor/page.tsx`: browser-local incident authoring in a compact archive frame. See the [route README](write/editor/README.md).

The `write/` route is the author landing; `write/editor/` hosts the browser-local incident editor.
