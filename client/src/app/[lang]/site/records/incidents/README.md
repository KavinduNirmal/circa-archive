# Incidents route

## Responsibility

`page.tsx` renders the incident class of the released index through
`ArchiveRecordType`, with its own metadata in both languages.

## Boundaries

The listing component, the record table, and the copy live in
`../../../../../../components/archive-site/`. This route resolves the language and
metadata only; an incident is the `incident` class of the shared fixture index,
not a second corpus.

## Usage

`/{lang}/site/records/incidents` lists every released incident. Covered by
`tests/archive-site.test.tsx`.
