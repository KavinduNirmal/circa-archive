# Project routes

## Responsibility

The pages that sit outside the fiction. `about/page.tsx` renders the project
page: what CIRCA Archive is, what is invented, the two editions, and the
boundaries of the site. It is linked from the archive's masthead as "About the
site".

## Boundaries

This is the only part of the app allowed to describe the project as a project.
The public archive and the workstation never link here except through that
labelled button. Copy lives in the `meta` namespace and is rendered on the
server.

## Usage

`/{lang}/meta/about`. Covered by `tests/archive-site.test.tsx`.
