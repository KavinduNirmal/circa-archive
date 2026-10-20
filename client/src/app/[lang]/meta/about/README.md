# About the site

## Responsibility

`page.tsx` resolves the language, sets the locale, builds the page metadata, and
renders the dossier from `../../../../../components/meta/`. The shared chrome —
navigation, frame, footer — comes from `../layout.tsx`.

## Boundaries

No fiction chrome and no record content: this page answers a question about the
thing the reader was using. All copy comes from the `meta` namespace, and the
page distinguishes the integrated account service from notes and drafts that
remain local to the current tab.

## Usage

`/{lang}/meta/about`. Covered by `tests/archive-site.test.tsx`.
