import type { Parents, PhrasingContent, Root } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import type { RenderWarning } from "./types";
import { warningBag } from "./validate";

/*
 * Resolving `||redacted||` off the tree rather than inside the tokenizer.
 *
 * By the time a transform runs, the table repair in `normalise-redactions` has
 * turned an in-cell delimiter into escaped pipes, so the cell holds the literal
 * two characters and this walk finds them wherever they are: a paragraph, a
 * blockquote, a heading, a table cell, or a code span. One mechanism covers all
 * of them, and it is a pure function of a string, so it unit-tests on its own.
 *
 * A code span is included deliberately. `||redacted||` written between
 * backticks is markup the author used to mark a redaction, not a code sample,
 * and the corpus carries two of them inside a table cell.
 */

function partsFor(value: string, line: number | undefined, warnings: RenderWarning[]): PhrasingContent[] | null {
  if (!value.includes("||")) return null;
  const parts = value.split("||");
  const delimiters = parts.length - 1;
  const paired = delimiters % 2 === 0 ? delimiters : delimiters - 1;
  if (paired !== delimiters) {
    // Fail closed: an unpaired delimiter stays literal text rather than opening
    // a redaction that never closes and swallowing the rest of the paragraph.
    warnings.push({
      code: "unmatched-redaction",
      message: `A redaction delimiter with no partner is left as text${line === undefined ? "" : ` on line ${line}`}.`,
      ...(line === undefined ? {} : { line }),
    });
  }
  const children: PhrasingContent[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    const text = parts[index];
    if (index % 2 === 0) {
      if (text) children.push({ type: "text", value: text });
      continue;
    }
    if (index <= paired) {
      children.push({ type: "redaction", children: text ? [{ type: "text", value: text }] : [] });
      continue;
    }
    children.push({ type: "text", value: `||${text}` });
  }
  return children;
}

export const remarkRedactions: Plugin<[], Root> = () => (tree, file) => {
  const warnings = warningBag(file);
  visit(tree, (node, index, parent) => {
    if (node.type !== "text" && node.type !== "inlineCode") return;
    if (!parent || index === undefined || !("children" in parent)) return;
    const replacement = partsFor(node.value, node.position?.start.line, warnings);
    if (!replacement) return;
    (parent as Parents).children.splice(index, 1, ...(replacement as never[]));
    return [SKIP, index + replacement.length];
  });
};
