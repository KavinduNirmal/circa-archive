# Index route

## Responsibility

`page.tsx` parses the canonical global-search URL and renders the fixture-backed
response from `src/lib/search/`. Search state stays in the address, and the
native GET form works without JavaScript. Search and filter URLs are marked
`noindex`; the unfiltered index remains indexable. `error.tsx` provides the recovery boundary; `layout.tsx` supplies only its localized recovery messages to the browser.

## Boundaries

The result table, translated controls, and chips belong to
`../../../../../components/archive-site/`. The shared parser, fixture adapter,
and server-only API adapter live in `../../../../../lib/search/`. Set
`SEARCH_SOURCE=api` to select the API adapter; the default remains `fixture`
for the public preview. The route resolves language, query
state, results, and metadata. The filter registry extends its URL contract with
organization, public author display name, record tag, character relationship, and
recovery custody. API-backed results use sort-bound keyset cursors.

## Structure

- `page.tsx` is the searchable index.
- `incidents/`, `explorations/`, and `evidence/` list one record class each
  through the shared `ArchiveRecordType` page.
- `rumours/` and `playlists/` are reserved addresses named in the section bar;
  each explains the relation it has to a record and returns to the index.
- `[code]/` holds one record, its downloads, and the explorations filed against
  it; `error.tsx` and `layout.tsx` supply the recovery boundary.

## Usage

`/{lang}/site/records` lists public fixture entries;
`/{lang}/site/records?q=INC-00014` searches by code. The class pages are
`/{lang}/site/records/incidents`, `/explorations`, `/evidence`, `/rumours`, and
`/playlists`. Covered by `tests/archive-site.test.tsx`, `tests/search-query.test.ts`,
and `tests/search-fixture.test.ts`. From `client/`, run `bun run test`,
`bun run lint`, `bun run typecheck`, and `bun run build`.

## Phase 3 rendering decision

The inherited `loading.tsx` streaming boundary was removed after the real API
no-JavaScript browser test reproduced a permanent index skeleton on a record
page. This conflicts with the plan's route-level loading-skeleton suggestion;
the plan's plain-HTML search/reading requirement takes priority. These routes
return completed server HTML instead of an automatic streaming fallback. Existing
loading copy/styles remain available for explicit client-side pending feedback.
