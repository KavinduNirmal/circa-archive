# Random record route

## Responsibility

Answers the archive's "Random" door: it picks a code from the index and
redirects to that record's page. The destination is a real record address, so
the result can be bookmarked.

## Boundaries

The route is dynamic on purpose — a random choice baked at build time would be
the same page on every request. The choice itself lives in
`archive-data.ts` so it can be tested without a server.

## Usage

`/{lang}/site/random`. Covered by the helper test in
`tests/archive-site.test.tsx`.
