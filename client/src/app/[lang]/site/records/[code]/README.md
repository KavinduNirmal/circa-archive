# Record route

## Responsibility

`page.tsx` prerenders one page per archive code in both languages and builds the
record's metadata from its own entry. `download/route.ts` serves the two copies
the archive can produce from the authored Markdown — Markdown and plain text —
and refuses a filing that is held rather than substituting a page for it.

## Boundaries

The page renders `ArchiveRecord`; the filing, the annotations, and the citation
web come from the reader's own modules, so the site and the workstation cannot
diverge. Unknown codes call `notFound()`.

The record's own footer — the metadata register, the cross-reference register, and
the colophon — is authored in the filing's Markdown rather than restated by the
page, so the reading edition and the download carry the same footer. A note
written in the annotations composer is held in the browser only: this route has no
write path, and the page says so where the note appears.

## Usage

`/{lang}/site/records/INC-00014`; the copy is at
`/{lang}/site/records/INC-00014/download?format=txt` or `?format=md`. The route
tests live in `tests/archive-site.test.tsx`.
