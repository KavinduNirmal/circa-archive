# Markdown renderer

## Responsibility

The one Markdown pipeline in the client. A record is parsed **once** into a
shared mdast, and every surface reads that tree: the on-screen sheet renders it
today, and an export reads the same tree rather than re-parsing the source. Two
parsers would drift, and the fiction is that a record is one artifact.

Nothing here needs React or the DOM, so the parse layer, the content warnings,
and the plain-text export are testable on their own. Presentation lives in
[`../../components/reader/README.md`](../../components/reader/README.md).

## Structure

- `pipeline.ts`: the shared plugin list and `parseRecord()`. The plugin list is
  exported so the React viewer can hand the *same* transforms to
  `react-markdown`; only then can the sheet and an export be the same document.
- `normalise-redactions.ts`: the pre-parse repair. In a GFM table row `|` is the
  cell divider, so `||redacted||` shatters the row into empty cells before any
  inline syntax can see it. Every unescaped `||` inside a table is rewritten to
  `\|\|`; outside a table the function is the identity.
- `redaction-plugin.ts`: resolves those delimiters off the tree into `redaction`
  nodes, in `text` **and** `inlineCode` nodes. An unpaired delimiter is left as
  literal text and warned about rather than opening a redaction that never closes.
- `image-directive-plugin.ts`: turns `![right|caption](path)` into a `figure`
  node, strips the alignment prefix from the caption, and resolves the path
  against `assetBaseUrl` when one is given. The convention is ours; CommonMark
  has no image alignment and no caption.
- `frontmatter-plugin.ts`: parses the YAML header and removes the node. Without
  `remark-frontmatter` the header is not a metadata block at all — it parses as
  a rule and loose text — and a `yaml` node left in the tree reaches the
  emitters, where the default handler prints it as a `<div>`.
- `heading-ids-plugin.ts`: per-parse, collision-free heading anchors.
- `validate.ts`: the warning bag and the cross-checks. Warnings are content
  defects; only corrupt YAML throws.
- `types.ts`: `RenderInput`, the warning vocabulary, and the two mdast nodes
  this renderer adds (`redaction`, `figure`), registered on mdast's own maps.
- `emitters/`: output targets. See its [README](emitters/README.md).

## The record conventions

| Convention | Meaning |
| --- | --- |
| YAML frontmatter | The record's fields. Parsed to data, never printed. |
| `## Heading` | A section boundary; the reader frame navigates these. An `###` stays inside its section. |
| `\|\|text\|\|` | A redaction. Resolved to a `redaction` node wherever it appears, including inside a table cell. |
| `![left\|right\|full\|caption](path)` | A figure with an alignment and a caption. |

## Boundaries

- **No `rehype-raw`.** Raw HTML is dropped, which is why the corpus's own syntax
  legend is inert and a `<script>` in a record is text. Enabling it would make
  the legend live markup and turn its unescaped `\|\|` into redactions.
- **No PDF, and no email body, yet.** `ARCHITECTURE.md` states that no PDF is
  generated and that `.pdf` is a diegetic lie; a real export is a decision the
  plan records as belonging to the product owner (`MARKDOWN_RENDERER_PLAN.md`
  §10 Q1/Q5), together with the Chromium deployment risk (§9 R1). The parse
  layer and the emitters are arranged so both can be added without touching the
  viewer: an emitter takes the same `ParsedRecord` this module already returns.
- The renderer never reads the archive index or the record service. It is handed
  a Markdown string and returns a tree or a string.

## Usage and verification

```ts
import { parseRecord } from "@/lib/markdown/pipeline";
import { renderText } from "@/lib/markdown/emitters/to-text";

const parsed = parseRecord({ markdown, assetBaseUrl }); // mdast + metadata + warnings
const text = renderText({ markdown }).output;           // .txt export
```

From `client/`, run `bun run test` for the corpus tests and
`bun run lint && bun run typecheck` for the rest. The behavioural contract is
pinned to `public/Ghost_story.md`: the table parses to 7 rows of 4 cells, the
six redactions resolve in document order, the three alignment directives become
figures, and the frontmatter survives as data and not as body text.
