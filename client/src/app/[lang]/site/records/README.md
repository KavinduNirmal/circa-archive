# Index route

## Responsibility

`page.tsx` parses the canonical global-search URL and renders the fixture-backed
response from `src/lib/search/`. Search state stays in the address, and the
native GET form works without JavaScript. Search and filter URLs are marked
`noindex`; the unfiltered index remains indexable. `loading.tsx` provides the
route skeleton, and `error.tsx` provides the recovery boundary.

## Boundaries

The result table, translated controls, and chips belong to
`../../../../../components/archive-site/`. The shared parser, fixture adapter,
and server-only API adapter live in `../../../../../lib/search/`. Set
`SEARCH_SOURCE=api` to select the API adapter; the default remains `fixture`
until the phase-two endpoint is ready. The route resolves language, query
state, results, and metadata.

## Usage

`/{lang}/site/records` lists public fixture entries;
`/{lang}/site/records?q=INC-00014` searches by code. Covered by
`tests/archive-site.test.tsx`, `tests/search-query.test.ts`, and
`tests/search-fixture.test.ts`. From `client/`, run `bun run test`,
`bun run lint`, `bun run typecheck`, and `bun run build`.
