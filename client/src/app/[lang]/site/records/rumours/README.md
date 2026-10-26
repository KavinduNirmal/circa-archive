# Rumours route

## Responsibility

`page.tsx` serves the reserved rumours address in the section bar. Rumours carry
no code and are filed under an incident, so the reading edition has no separate
rumour index; the page explains that relation and returns the reader to the
records index.

## Boundaries

The reserved-page shell and copy live in `../../../../../../components/archive-site/`.
This route does not invent a rumour corpus, a code, or a second reading path; a
rumour is read with the incident that holds it.

## Usage

`/{lang}/site/records/rumours`. Covered by `tests/archive-site.test.tsx`.
