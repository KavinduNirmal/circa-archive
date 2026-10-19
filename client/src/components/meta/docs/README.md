# Documentation surface

## Responsibility and structure

- `docs-topics.ts`: localized navigation keys, groups and reading order.
- `docs-source.ts`: GitHub source/edit/asset URLs, relative-link resolution,
  five-minute Next.js fetch caching, hourly file-history caching, and concurrent locale document loading.
- `docs-markdown.ts`: GFM, frontmatter, GitHub alert and heading plugins; contents
  extraction and the opening title split. No record redaction transforms run
  here: documentation syntax examples must remain literal.
- `docs-content.tsx`: safe Markdown rendering with relative links and assets.
- `docs-page.tsx`: source title, article, failure recovery, pager and contents rail.
- `docs-sidebar.tsx`: grouped index, global document text search, Ctrl/Cmd+K focus,
  Escape clearing and mobile disclosure with the current article label.
- `docs-actions.tsx`: compact raw Markdown/context copy actions below the title; ChatGPT opens for manual pasting.
- `copy-code.tsx`: code block clipboard feedback, also used by the landing page.

## Boundaries

Article prose lives in [docs/documentation](../../../../../docs/documentation/README.md),
not JSX or catalogs. Both English and Korean are fetched from the configured
public GitHub repository and ref. UI labels remain in the `meta` catalog.
Unknown slugs cannot select arbitrary upstream files. Fetch errors render a
localized retry/source state; missing search content is disclosed. Raw HTML is
inert. There is no bundled article fallback. The footer uses verified GitHub file history
for its date and links to the corresponding GitHub editor.

## Usage and verification

The documentation routes load the locale's registered sources on the server and
pass serializable text to the search and clipboard islands. See the source
README for publishing and environment overrides. Run `bun run --cwd=client test`,
`lint`, `typecheck`, and `build`. Tests include `docs-source.test.ts`,
`docs-experience.test.tsx`, `meta-pages.test.tsx`, and catalog parity checks.
