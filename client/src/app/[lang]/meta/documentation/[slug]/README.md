# Documentation topic route

## Responsibility

One documentation topic at `/{lang}/meta/documentation/{slug}`. The file resolves
the language and slug, sets the request locale, returns `notFound()` for a slug
that is not in the registry, and loads the locale sources and renders `DocsPage` with title
and description built from the topic's own keys.

## Boundaries

No copy, layout, or content here. The topic registry and
its order are in `components/meta/docs/docs-topics.ts`; changing a page means
changing the Markdown under `docs/documentation/`, not this route. Section anchors
and the contents rail are derived from that Markdown.

## Usage and verification

Eight slugs are enumerated by `generateStaticParams`; pages render on demand
with cached source fetches. the overview keeps the short address and is
not generated here. Covered by `tests/meta-pages.test.tsx` and the build route
table.
