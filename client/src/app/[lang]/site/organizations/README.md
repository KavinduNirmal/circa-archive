# Organizations route

## Responsibility

Renders the organizations directory: each body entered in the index, with its
code, status, filing date, abstract, and a count of the filings filed under it.

## Boundaries

The component and its copy live in `../../../../../components/archive-site/`.
An organization is a directory entry, not a personnel account; this route does
not invent contacts or members.

## Usage

`/{lang}/site/organizations`. Covered by `tests/archive-site.test.tsx`.

In `SEARCH_SOURCE=api` mode this route searches the real organization index and
reads the selected canonical/legacy code's dossier from `/api/v1/archive/{code}`.
It renders no fixture fallback on API failure. `test:e2e:search` covers navigation
from an organization search result into this directory.
