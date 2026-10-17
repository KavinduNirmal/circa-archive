# Documentation surface

## Responsibility

The project documentation: its topic registry, its prose, and the three-column
reading surface (index, article, on-page contents).

| File | Owns |
| --- | --- |
| `docs-topics.ts` | The groups, topic order, addresses, and every section anchor. Holds message keys, never prose. |
| `docs-content.tsx` | The body of each section, the callout/table/code primitives, and the anchor links. |
| `docs-page.tsx` | The band, the three-column grid, the sidebar data, the pager, and the table of contents. |
| `docs-sidebar.tsx` | The filter, the grouped index, the mobile disclosure, and the active state. Client island. |
| `copy-code.tsx` | The code plate and its copy key, including the failed-clipboard state. Client island. |

## Boundaries

All copy is in the `meta` catalog under the `docs*` keys, in both languages. The
topic order here is the reading order: the sidebar, the pager, and
`generateStaticParams` all read the same list, so a topic cannot be added to one
and forgotten in the other.

The docs describe the code in this repository, not the fiction. They do not
promise an API, a database, or a deployment; `ARCHITECTURE.md` is named as a
draft wherever the plan comes up.

## Usage and verification

Served by the routes in `app/[lang]/meta/documentation/`. Covered by
`tests/meta-pages.test.tsx` (rendering, sidebar filter, pager, copy labels,
Korean headings) and `tests/i18n-messages.test.ts`. New topic: add an entry to
`docs-topics.ts`, add its section bodies to `docs-content.tsx`, add the keys to
both catalogs, then run `bun run --cwd=client test`, `lint`, `typecheck`, and
`build`.
