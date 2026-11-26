# Publication styles

## Responsibility and structure

The project website uses near-white archival paper, burnt-orange ink, Instrument Serif display, IBM Plex Sans reading copy, IBM Plex Mono annotations, and Design E's asymmetric essay. `site.css` is a thin entry point; each concern lives in its own module and is imported in cascade order:

| Module              | Owns                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `tokens.css`        | Palette, type stacks, spacing, measure, header height, printed-field values.           |
| `base.css`          | Reset, element defaults, focus, selection, scrollbars, the fixed dot field, a11y help. |
| `layout.css`        | Thin mono navigation bar, dropdown panels, mobile menu, reading frame, footer.         |
| `editorial.css`     | Openings, margin notes, passages, quotations, record specimens, indexes, page bodies.  |
| `prose.css`         | Rendered Markdown: headings, lists, code, tables, alerts, brand blocks, figures.       |
| `documentation.css` | Three-column reader, docs-only search, chapter disclosures, article header, pager.     |
| `print.css`         | Print overrides at the end of the cascade.                                             |

Add a rule to the module that owns the element, not to `site.css`. A new page composition belongs in `editorial.css` or `documentation.css`; a new token belongs in `tokens.css`.

## Boundaries

Only the meta website imports these files. The archive and workstation run in the separate Next.js client and must not inherit this palette or typography. The burnt-orange accent is the sole colour accent: links, the second display line, annotations, the seal, and the peripheral bitmap field. Hairlines and whitespace carry structure; cards, shadows, bevels, and gradients are out of scope.

Navigation follows the selected study: a flat 60px strip, mono links, a filled current state with an inset ink underline, and quiet ruled dropdown panels. Disclosures use a drawn plus that becomes a minus. Documentation chapter items use accent colour and an underline rather than a filled row. Search is deliberately absent from global chrome; the only search field lives in the documentation sidebar and in that reader's keyboard shortcut.

The fixed dot field sits behind content (`z-index: -1` inside an isolated body), is pointer-transparent, fades before the reading column, and disappears in print. The seal remains a static halftone SVG plate, printed small in the footer, the project margin, and the specimen header rather than as a hero decoration.

## Verification

From `meta/`, run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e`. Inspect English and Korean pages at 375, 768, 1024, and 1440px, including mobile disclosures, large text, focus, search, and reduced motion. Passing overflow assertions alone does not establish visual quality.
