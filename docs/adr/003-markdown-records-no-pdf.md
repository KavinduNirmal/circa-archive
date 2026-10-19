# 003: Records are Markdown rendered as paper, not generated PDFs

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

In the fiction, every record is a `.pdf` filed into a case folder. Implementing that literally would mean storing or generating real PDF binaries, which adds a headless-browser or PDF-library dependency, a rendering pipeline that must match the on-screen sheet, and an artifact that is hard to diff, edit, and search.

Records are also collaborative and mutable: they are written in the workstation, read in the archive, forked, and sometimes exported. A binary primary format makes all of that harder, and a second renderer would drift from the first.

The repository already implements the alternative: [`client/src/lib/markdown`](../../client/src/lib/markdown/README.md) parses a record once into a shared syntax tree, renders it as a paper-like sheet, and derives a plain-text export from the same tree.

## Decision

Markdown is the only record format. The `.pdf` extension is a display convention, not a file type.

- A record is stored as Markdown with YAML frontmatter. The frontmatter holds the record's fields and is parsed to data, never printed.
- One pipeline parses a record into a syntax tree. The on-screen sheet and every export read that same tree; the plugin list is shared with the React viewer so the two cannot diverge.
- The renderer adds only what the fiction needs as explicit nodes: redactions (`||text||`), figures with alignment and captions (`![right|caption](path)`), and heading anchors. It does not accept raw HTML.
- Downloads are derived from the Markdown, not stored as binaries. The `.pdf` filename remains in the fiction and in the archive code scheme.
- Any future PDF or print output is an emitter over the existing parse tree, not a second rendering path.

## Consequences

**Positive.** Records are diffable, searchable, editable, and cheap to store. The archive can render server-side without a browser process. Dropping raw HTML removes a class of injection bugs and keeps a record's own syntax examples inert. Exports cannot drift from the sheet because they share the parse.

**Negative.** The fiction's file extension does not correspond to a real format, which will confuse readers who download a record expecting a PDF. A real PDF remains a product decision that would need a deployment story (a headless browser or a PDF library) and a visual parity test. Browser print is not the same artifact as the sheet.

**Follow-ups.** If print or PDF export is added, it must consume [`parseRecord()`](../../client/src/lib/markdown/pipeline.ts) and be tested for visual parity with the reader. The exported `.txt` emitter is the precedent for how a new output target is added without touching the viewer.

## Alternatives considered

- **Generate real PDFs on write or on download.** Rejected: a binary primary artifact, an extra runtime dependency, and a second renderer to keep in sync with the sheet. The `.pdf` extension is part of the fiction, not of the storage model.
- **Store rendered HTML instead of Markdown.** Rejected: loses editability and diffability, and makes sanitisation a per-write concern rather than a property of the pipeline.
- **A WYSIWYG editor with a structured document model.** Rejected for now: Markdown is the authoring surface the fiction describes, and a rich-text model would be a larger change than the product currently justifies.

## References

- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3.3 and §5.4 — no PDF generation; the extension as a diegetic lie.
- [`client/src/lib/markdown/README.md`](../../client/src/lib/markdown/README.md) — the pipeline, the record conventions, and the no-raw-HTML boundary.
- [`client/src/lib/markdown/pipeline.ts`](../../client/src/lib/markdown/pipeline.ts) — the shared plugin list and `parseRecord()`.
- [`client/src/lib/markdown/emitters`](../../client/src/lib/markdown/emitters) — the output targets.
