# Layouts

## Responsibility

`Shell.astro` owns the project document: metadata and canonical/hreflang links, font imports, the style entry, the skip link, the flat navigation bar, the reading frame, and the footer.

## Structure and boundaries

The header keeps the site's Home, Documentation, About, Sponsor, Enter-the-archive, and language structure, restyled as the selected study's thin mono strip. Dropdowns are native `details`; the mobile disclosure reveals the same nav through a sibling selector so it works without JavaScript. Search is not part of the shell — it lives only in the documentation reader. The footer carries the small seal, the fiction statement, the three link groups, and the top action.

Keep project presentation separate from the Next.js archive and workstation. Public article sources remain in the repository documentation; private notes are never published. Styling belongs in `../styles/` modules, never inline here.

## Usage and verification

From `meta/`, run `bun run typecheck`, `bun run test`, and `bun run build`. The no-JavaScript navigation and search scope are covered by `../e2e/website.spec.ts`. See the [project guide](../../README.md).
