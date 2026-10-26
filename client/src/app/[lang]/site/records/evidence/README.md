# Evidence route

## Responsibility

`page.tsx` renders the evidence class of the released index through
`ArchiveRecordType`, with its own metadata in both languages.

## Boundaries

The listing component, the record table, and the copy live in
`../../../../../../components/archive-site/`. This route resolves the language and
metadata only; evidence is the `evidence` class of the shared fixture index.

## Usage

`/{lang}/site/records/evidence` lists every released evidence record. Covered by
`tests/archive-site.test.tsx`.
