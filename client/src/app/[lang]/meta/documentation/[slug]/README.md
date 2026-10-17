# Documentation topic route

## Responsibility

One documentation topic at `/{lang}/meta/documentation/{slug}`. The file resolves
the language and slug, sets the request locale, returns `notFound()` for a slug
that is not in the registry, and renders `<DocsPage topic={topic} />` with title
and description built from the topic's own keys.

## Boundaries

No copy, layout, or content here. The topic registry, its section anchors, and
its order are in `components/meta/docs/docs-topics.ts`; changing a page means
changing that registry and `docs-content.tsx`, not this route.

## Usage and verification

Eight slugs are generated statically; the overview keeps the short address and is
not generated here. Covered by `tests/meta-pages.test.tsx` and the build route
table.
