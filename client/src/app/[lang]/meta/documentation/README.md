# Documentation routes

## Responsibility

The documentation's front door and its topic pages.

- `page.tsx` serves the overview at `/{lang}/meta/documentation`. It uses the
  same `DocsPage` component as a topic, with the overview topic as its subject.
- `[slug]/page.tsx` serves every other topic at a static address. It validates
  the slug, sets the request locale, builds metadata from the topic title and
  lede, and renders `DocsPage`.

## Boundaries

This folder resolves routes and metadata; it holds no prose and no layout. The
topic registry is `components/meta/docs/docs-topics.ts`; the prose is
`docs-content.tsx`; the copy is the `meta` namespace.

## Usage and verification

`/{lang}/meta/documentation` and `/{lang}/meta/documentation/{getting-started,
project-structure,records,rendering,routes,contributing,testing,design}`. Covered
by `tests/meta-pages.test.tsx`. `generateStaticParams` prerenders every topic in
both languages; check the build route table after adding a topic.
