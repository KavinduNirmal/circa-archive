# Index route

## Responsibility

`page.tsx` renders the index of every released entry and the result of a `?q=`
search. The query is read from `searchParams` and filtered by
`searchArchive`, so the page is server-rendered per request and the result is a
link that can be shared.

## Boundaries

The table, the labels, and the search form belong to
`../../../../../components/archive-site/`. This file only resolves the language,
the query, and metadata.

## Usage

`/{lang}/site/records` lists the index; `/{lang}/site/records?q=INC-00014`
searches it. Covered by `tests/archive-site.test.tsx`.
