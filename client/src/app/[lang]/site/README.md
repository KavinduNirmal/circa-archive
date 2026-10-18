# Public archive routes

## Responsibility

The full-page reading edition's routes. Each file resolves the reader's language,
sets the request locale, builds route metadata, and renders a component from
`../../../../components/archive-site/`. No page holds copy or layout.

## Structure

- `page.tsx`: the archive home.
- `records/page.tsx`: the index, with the `?q=` search read from `searchParams`
  and filtered on the server.
- `records/[code]/page.tsx`: one record, prerendered for every code in the
  index; an unknown code is a 404.
- `records/[code]/download/route.ts`: the Markdown and plain-text copies of a
  released filing, and a 404 for a held one.
- `organizations/page.tsx`, `about/page.tsx`: the directories and the guide.
- `random/page.tsx`: redirects to a randomly chosen record on each request.

## Boundaries

The archive is reached at `/{lang}/site`; the public portal stays at `/{lang}`
and the workstation at `/{lang}/desktop`. The project page is `/{lang}/meta`
and is the only route here that leaves the fiction. Record content is not
translated — the filings are English documents and stay so in Korean.
