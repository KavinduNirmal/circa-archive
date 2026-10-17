# Record download

## Responsibility

`route.ts` is a GET handler that turns a released filing into a file: the raw
authored Markdown, or the plain-text export from the same pipeline. It prints a
short header with the code, filing date, holder, and clearance, and sets a
download filename.

## Boundaries

A held filing has no copy, so this route answers 404 instead of returning the
index entry as a substitute. No other format is offered: the archive does not
have a PDF to give. The text export prints redactions as `[REDACTED]`.

## Usage

`GET /{lang}/site/records/{code}/download?format=txt|md`. Covered by
`tests/archive-site.test.tsx`.
