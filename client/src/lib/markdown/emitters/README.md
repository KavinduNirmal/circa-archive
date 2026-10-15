# Markdown emitters

## Responsibility

The output targets that are not the sheet. Each one takes the tree
`parseRecord()` already produced and writes a different document from it, so no
target ever re-parses the record and no two targets can disagree about what it
says.

## Structure

- `to-text.ts`: the `.txt` record. Padded, aligned tables (both stock tools
  flatten a GFM table into a run of words), the frontmatter re-emitted as a
  printed `CIRCA CODE: …` header rather than raw YAML, image captions without
  their paths, and prose wrapped at eighty columns.

## Boundaries

- **A redaction is a promise, not a style.** In an export `||text||` is
  `[REDACTED]` and the withheld words are not in the string, in the tree walk
  before it, or in the output buffer. That is why this emitter does not accept a
  reveal mode from its caller: no export reveals anything.
- Emitters return `RenderResult<string>`; a byte-producing target (a PDF) would
  return bytes from the same tree rather than a string.
- Nothing here may depend on `"use client"` code, so that an export can run in a
  route handler when one exists.

## Verification

`tests/markdown-text.test.ts` holds the export to the corpus: no `|`, no `**`,
no leading `#`, no raw YAML, no `||`, no image path, no bare `#` link target, and
no line past eighty columns outside the table and the header block.
