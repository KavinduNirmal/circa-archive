# About the site

## Responsibility

`page.tsx` resolves the language, sets the locale, builds the page metadata, and
renders `MetaAbout` from `../../../../../components/meta/`.

## Boundaries

No fiction chrome and no record content: this page answers a question about the
thing the reader was using. All copy comes from the `meta` namespace.

## Usage

`/{lang}/meta/about`. Covered by `tests/archive-site.test.tsx`.
