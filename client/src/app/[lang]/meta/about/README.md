# About the site

## Responsibility

`page.tsx` resolves the language, sets the locale, builds the page metadata, and
renders the dossier from `../../../../../components/meta/`. The shared chrome —
navigation, frame, footer — comes from `../layout.tsx`.

## Boundaries

No fiction chrome and no record content: this page answers a question about the
thing the reader was using. All copy comes from the `meta` namespace, and the
page asserts nothing the project cannot do — the FAQ says plainly that there is
no backend and that notes are not saved.

## Usage

`/{lang}/meta/about`. Covered by `tests/archive-site.test.tsx`.
