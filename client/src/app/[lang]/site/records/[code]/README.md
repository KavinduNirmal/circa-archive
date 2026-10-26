# Record route

## Responsibility

`page.tsx` renders one page per archive code in both languages and builds the record's metadata from its selected data source. The page is dynamic so runtime source selection and approved-reader bodies cannot use prerendered fixture HTML. `download/route.ts` serves the two copies
the archive can produce from the authored Markdown — Markdown and plain text —
and refuses a filing that is held rather than substituting a page for it.
`explorations/page.tsx` prerenders the list route for the records that have
explorations filed against them; see its own [README](explorations/README.md).

## Boundaries

The page renders `ArchiveRecord`; the filing, the annotations, the status
updates, the citation web, and the exploration relation come from the reader's
own modules, so the site and the workstation cannot diverge. Unknown codes call
`notFound()`.

The record's own footer — the metadata register, the cross-reference register, and
the colophon — is authored in the filing's Markdown rather than restated by the
page, so the reading edition and the download carry the same footer. A note
written in the annotations composer is held in the browser only: this route has no
write path, and the page says so where the note appears.

Status updates have their own sidebar section, folded into one accordion of
coloured cards, and never enter the sheet: they are the record's history rather
than its text, and a reader is not asked to step through them. The exploration
count in the particulars is the only link to the list route.

## Usage

`/{lang}/site/records/INC-00014`; the copy is at
`/{lang}/site/records/INC-00014/download?format=txt` or `?format=md`, and the
exploration list at `/{lang}/site/records/INC-00027/explorations`. The route
tests live in `tests/archive-site.test.tsx`.

## API mode

`SEARCH_SOURCE=api` switches this route and its metadata to the scoped archive read
endpoint; it accepts real codes beyond the fixture corpus. Unknown/hidden entries
404, outages reach the parent error boundary, and session-dependent bodies are
never cached. Sealed incident prose is fetched only after the GET acknowledgment
(`acknowledge=true`); sealed records require a stored approval for the live viewer.
Visible rumours have stable anchors. Fixture downloads/exploration lists are not
linked from the API reader. The default fixture preview retains its existing behavior.
