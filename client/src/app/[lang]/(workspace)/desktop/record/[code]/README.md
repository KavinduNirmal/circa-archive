# Record route

## Responsibility

`/{lang}/desktop/record/{code}` — the reader focused on one archive code. Like its
sibling pages, it is a URL marker: the workspace layout owns the shell, and
`DesktopUrlSync` opens the reader (or moves its trail cursor) for the code.

## Structure

- `page.tsx`: `generateStaticParams` over `ARCHIVE_INDEX`, `dynamicParams =
false`, and an `isRecordCode` guard that calls `notFound()`. It renders `null`.

## Boundaries

Every released code is prerendered in both languages; anything else is a 404,
matching `/{lang}/site/records/[code]`. The public page stays the canonical,
indexable copy — this address is a workspace position and is `noindex`.

A code is written as one percent-encoded segment, and every shipped code is a
single segment. The incoming param is decoded defensively anyway, so a code that
someday needs an escape still arrives whole; `src/lib/desktop-route.ts` owns both
directions of that mapping, and `tests/desktop-route.test.ts` round-trips every
code.

## Usage and verification

`bun run build` lists the codes under `/[lang]/desktop/record/[code]`. The browser
suite loads an incident code, an exploration code, and an unknown code, and
checks the reader's heading and the 404 status.
