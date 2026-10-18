# Explorations route

## Responsibility

`page.tsx` resolves a record code and prerenders its exploration list at
`/{lang}/site/records/{code}/explorations`. The list itself is
`ArchiveExplorations` in `../../../../../../components/archive-site/`; this file
only resolves the language, the metadata, and which codes are worth generating.

## Boundaries

Only records whose inbound citation web contains an `EXPLORATION` are
prerendered. A code with no exploration list has no route: a direct visit calls
`notFound()` rather than showing an empty register.

The page is not a second kind of record page. Every row is the ordinary record
table, and every code opens the ordinary record route; the exploration relation
comes from `explorationsFor` in the reader's citation module, so the list cannot
drift from the workstation's count.

## Usage

`/{lang}/site/records/{code}/explorations`. The link is the exploration row in
the record's particulars; `tests/archive-site.test.tsx` covers the list and the
link.
