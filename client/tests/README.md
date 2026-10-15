# Frontend unit tests

## Responsibility and structure

- `landing.test.tsx`: archive entry, audience procedures, local link integrity, service limitations, and diegetic route metadata.
- `setup.ts`: DOM matchers and cleanup.
- `utils.test.ts`: class composition and Tailwind conflict resolution.
- `desktop.test.tsx`: folder navigation, Escape dismissal, Start launcher behavior, and the reader as a maximized window that survives a trip to the taskbar.
- `window-registry.test.ts`: focus handover when a window is minimized or closed.
- `window-manager.test.tsx`: window placement, drag and resize, maximize, stacking, and taskbar state.
- `archive-index.test.ts`: the archive query rules, ranking, and the shipped fixture's formats.
- `browser.test.tsx`: the single tab, the search flow, the handoff of a code to the reader, the refusals, and the blocked controls.
- `mailbox-index.test.ts`: folder splits, read state, sorting, find, and the queue stamp.
- `mail.test.tsx`: the panes, reading and marking read, sorting, find, delete, queueing, and the retention refusal.
- `reader-model.test.ts`: the scale steps and limits, the vocabulary, section numbering and anchors, and literal search.
- `record-filings.test.ts`: the sectioned document for every index entry, the metadata the sheet borrows rather than restates, and the withheld body.
- `record-sources.test.ts`: the authored record Markdown, the corpus held byte-identical to `public/Ghost_story.md`, and the `##`-only section split.
- `markdown-normalise.test.ts`: the pre-parse table repair, the one line it changes, and the twelve-cell row it exists to prevent.
- `markdown-pipeline.test.ts`: frontmatter as data, the six redactions, the three figures, header/body disagreement, and unmatched delimiters.
- `markdown-text.test.ts`: the plain-text export — padded tables, `[REDACTED]`, the printed metadata header, and the eighty-column measure.
- `record-markdown.test.tsx`: the viewer — the repaired table, figure alignment, labelled and revealable redactions, and inert raw HTML.
- `reader-correspondence.test.ts`: note anchoring against the sections that exist, one-level replies, and both directions of the citation web.
- `reader-references.test.tsx`: the strip's ten-per-direction cap, the box that explains it, the collapse to a head row, and the two empty states.
- `reader.test.tsx`: the frame's empty slot, the three silent controls, the arrangements, the search count, the session gate, the two engagement signals, the trail, both rails, the corpus record rendered through the frame — its four sections, its table, its figures, and a redaction opened on the sheet — and the status the sheet's stamp carries.

## Usage and boundaries

Run `bun run test` or `bun run test:watch` from `client/`. Browser interaction and responsive checks belong in `../e2e/`; repository tooling tests remain separate.
