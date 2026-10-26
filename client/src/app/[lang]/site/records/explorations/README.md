# Explorations route

## Responsibility

`page.tsx` renders the exploration class of the released index through
`ArchiveRecordType`, with its own metadata in both languages.

## Boundaries

This is the class-wide list of exploration records, not the explorations filed
against one record. The latter is `../[code]/explorations/page.tsx`; the listing
component and copy live in `../../../../../../components/archive-site/`.

## Usage

`/{lang}/site/records/explorations` lists every released exploration. Covered by
`tests/archive-site.test.tsx`.
