# The rendering pipeline

A record is parsed once. The sheet, the text export, and the Markdown download all read the same result.

## One parse, two renderers

parseRecord() in lib/markdown/pipeline.ts returns three things: an mdast tree, the YAML metadata, and a warning list. It does not return HTML, a React element, or a string.

The on-screen sheet and the exports share that tree. Two parsers would drift, and the fiction is that a record is one artifact.

```ts
import { parseRecord } from "@/lib/markdown/pipeline";
import { renderText } from "@/lib/markdown/emitters/to-text";

const parsed = parseRecord({ markdown, assetBaseUrl });
const text = renderText({ markdown }).output;
```

There are two React renderers, not two pipelines: record-prose.tsx renders the tree on the server for the reading edition, and record-markdown.tsx hands the same plugin list to react-markdown in the workstation viewer.

## The plugin list

| Plugin                   | What it does                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `remark-frontmatter`     | parses the YAML header and removes the node, so it never reaches the renderers.             |
| `remark-gfm`             | tables, strikethrough, autolinks, and task lists.                                           |
| `normalise-redactions`   | escapes double pipes inside a table cell before GFM can split the row.                      |
| `redaction-plugin`       | turns paired double pipes into redaction nodes in text and inline code.                     |
| `image-directive-plugin` | turns an alignment directive into a figure node, and strips the alignment from the caption. |
| `heading-ids-plugin`     | gives each heading a per-parse, collision-free anchor.                                      |

Add a plugin to the shared list, then make every renderer and emitter handle the node it produces. A transform that exists only in the viewer is not part of the pipeline.

## Warnings are content

The pipeline collects defects instead of throwing. Only corrupt YAML stops a parse; everything else still renders.

- unmatched-redaction — an odd number of delimiters; the unpaired one stays literal.
- unknown-image-align — the alignment word is not left, right, or full.
- relative-image — the image cannot be resolved without an asset base.
- metadata-disagreement — the header and the body print different statuses. It is left visible on purpose.

A warning is a content defect, not an engineering failure. The test corpus deliberately disagrees with its own header, because the fiction is about records that contradict themselves.

## Exports and redactions

The plain-text export pins redactions to hidden: the withheld words are not in the string at all. The Markdown download serves the authored source, the only copy that contains them.

Exports are generated from the authored Markdown, not from the rendered page. There is no PDF generation; a record's .pdf name belongs to the fiction.

> [!WARNING]
> A held filing has no download
>
> The download route returns 404 for a filing the archive has not released.

## What the renderer will not do

It never reads the archive index or the record service. It is handed a string and returns data. Keep it that way: the same parse must serve a test, an export, a server page, and a browser without a second implementation.

No raw HTML, no HTML injection, no editor-specific syntax, and no network. Relative figure paths resolve only against an asset base the caller supplies.
