import type { Root } from "mdast";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified, type PluggableList } from "unified";
import { VFile } from "vfile";
import { remarkFrontmatterData } from "./frontmatter-plugin";
import { remarkHeadingIds } from "./heading-ids-plugin";
import {
  remarkImageDirective,
  type ImageDirectiveOptions,
} from "./image-directive-plugin";
import { normaliseTableRedactions } from "./normalise-redactions";
import { remarkRedactions } from "./redaction-plugin";
import type { ParsedRecord, RenderInput } from "./types";
import { collectWarnings, disagreementWarning, metadataOf } from "./validate";

/**
 * The record pipeline, as one list.
 *
 * It is a list rather than a function body because two callers have to share
 * it: this module parses for the emitters, and `RecordMarkdown` hands the same
 * list to `react-markdown` for the sheet. If the viewer and the export ran
 * different transforms they would show different documents, and the fiction is
 * that a record is one artifact.
 *
 * Order matters. GFM first, because the table syntax has to exist before the
 * normaliser's escaped pipes can be read as a cell. Frontmatter next, so the
 * YAML is a node before anything walks the tree. Then the three transforms, and
 * anchors last, once the text they are named from has settled.
 */
export function recordPlugins(
  options: ImageDirectiveOptions = {},
): PluggableList {
  return [
    remarkGfm,
    [remarkFrontmatter, ["yaml"]],
    remarkFrontmatterData,
    remarkRedactions,
    [remarkImageDirective, options],
    remarkHeadingIds,
  ];
}

/** The list the on-screen viewer uses: no asset base, so images stay relative. */
export const RECORD_REMARK_PLUGINS: PluggableList = recordPlugins();

/**
 * Parse a record into the one tree every target reads from.
 *
 * Parsing happens once and the result fans out, which is the invariant that
 * keeps the sheet and an export from drifting. The table repair runs first, on
 * the string, because by the time a parser is involved the damage is already
 * done.
 */
export function parseRecord(input: RenderInput): ParsedRecord {
  const source =
    input.normalise === false
      ? input.markdown
      : normaliseTableRedactions(input.markdown);
  const processor = unified()
    .use(remarkParse)
    .use(recordPlugins({ assetBaseUrl: input.assetBaseUrl }));
  const file = new VFile({ value: source });
  const output = processor.runSync(processor.parse(source), file) as Root;
  const warnings = collectWarnings(file);
  const metadata = metadataOf(file);
  const disagreement = disagreementWarning(source, metadata);
  if (disagreement) warnings.push(disagreement);
  return { output, metadata, warnings };
}
