# App Router

## Responsibility and structure

- `[lang]/`: the language segment every page lives under, and the root layout that
  renders the document. See its [README]([lang]/README.md).
- `globals.css`: the design tokens, the Tailwind theme bridge, base rules, and only
  the shared CIRCA utilities. Every component-specific stylesheet lives beside the
  component that owns it, under `../components/`.

There is no `layout.tsx`, `page.tsx`, or `desktop/` at this level any more. Both
routes moved under the language segment when the client became bilingual, so the
segment's layout is the root layout. The workstation itself lives in the
`(workspace)` route group under `[lang]/`: a group keeps the shell mounted across
`/{lang}/desktop` URLs without adding a segment to them.

## Boundaries and verification

Routes compose reusable components from `../components/` and hold no copy: every
sentence they render comes from the catalogs in `../../messages/`. `/{lang}`
renders the agency portal with its scoped stylesheet in `../components/site/`,
public procedures, and diegetic route metadata. `/{lang}/desktop` plays the post
screen before the shell, so the workstation is entered rather than merely loaded;
the post screen and the shell live in the `(workspace)` layout so a deep link or
Back does not replay the post or discard the open windows.
Backend integration is not implemented; the application screens are the archive
browser behind Search, the mail client behind Inbox, the file browser behind every
folder destination, and the record editor behind CIRCA Word.

Bare paths are not routes. `src/proxy.ts` redirects `/` and `/desktop` to the
reader's language, so one document is reachable at exactly one address.

Run client lint, typecheck, unit tests, and build after changes; browser tests
exercise both routes in both languages.
