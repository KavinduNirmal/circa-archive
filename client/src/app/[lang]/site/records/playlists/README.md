# Playlists route

## Responsibility

`page.tsx` serves the reserved playlist address in the section bar. A playlist is
a sequence of records for reading; the reading edition names the section before it
serves an index of playlists, so the page explains the reservation and returns the
reader to the records index.

## Boundaries

The reserved-page shell and copy live in `../../../../../../components/archive-site/`.
Playlists that hang off a record stay on that record's own page; this route does
not author a playlist corpus.

## Usage

`/{lang}/site/records/playlists`. Covered by `tests/archive-site.test.tsx`.
