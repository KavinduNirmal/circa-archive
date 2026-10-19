# Project routes

## Responsibility

The project layer outside the fiction: the landing report at `/{lang}/meta`, the
dossier at `/{lang}/meta/about`, and the documentation at
`/{lang}/meta/documentation` and `/{lang}/meta/documentation/[slug]`.

The landing page makes the argument in six sections (premise, editions,
documentation, machinery, contribution, questions) and stops there; the footer
holds the doors. The dossier is the long account and the terms. The documentation
is the code manual: setup, record format, renderer, routes, contribution, tests,
and design systems.

## Structure

- `layout.tsx`: the one chrome for all three surfaces. It imports the project
  fonts and `components/meta/meta.css`, sets the request locale, and renders
  `MetaChrome` around the page. The chrome supplies the skip link, the top status
  line, the shadcn navigation (whose first item is Home, pointing at `/{lang}/meta`
  rather than the language root), the framed `<main>`, and a three-column footer.
- `page.tsx`: the landing report; metadata from `metadata.metaHome*`. No closing
  call to action: after the questions, the chrome's footer is the next thing.
- `about/page.tsx`: the dossier; metadata from `metadata.metaAbout*`.
- `documentation/page.tsx`: the documentation overview at its short address.
- `documentation/[slug]/page.tsx`: one topic, statically generated for every
  slug except the overview; an unknown slug is a 404.
- `documentation/README.md` and `documentation/[slug]/README.md`: the notes for
  the two documentation routes.

## Boundaries

This is the only part of the app allowed to describe the project as a project.
The archive links here only through labelled buttons. All copy lives in the
`meta` namespace; the docs topics and their section keys live in
`components/meta/docs/docs-topics.ts`, and their bodies in `docs-content.tsx`.

The pages assert no capability the project does not have. While the backend
solution is scaffolded, frontend integration is pending, so notes and drafts are
described as living in the browser tab; there is no mail service, so the contact
doors are repository issues.

## Usage and verification

`/{lang}/meta`, `/{lang}/meta/about`, and `/{lang}/meta/documentation`. Covered
by `tests/archive-site.test.tsx`, `tests/meta-pages.test.tsx`, and the catalog
contract in `tests/i18n-messages.test.ts`. Run `bun run --cwd=client test`,
`lint`, `typecheck`, and `build`.
