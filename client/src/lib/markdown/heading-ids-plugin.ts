import type { Heading, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/*
 * Heading anchors, unique within one parse.
 *
 * The slugger is created per transform, so a re-render of the same record
 * starts counting again rather than walking a second `Field Account` to `-3`.
 * A repeated heading gets `-1`, `-2`, and so on, so two sections named alike
 * never collide on one anchor.
 */

/** The text of a heading with its inline markup flattened away. */
function textOf(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const held = node as { value?: unknown; children?: unknown[] };
  if (typeof held.value === "string") return held.value;
  if (Array.isArray(held.children)) return held.children.map(textOf).join("");
  return "";
}

/** A heading anchor: lower case, runs of punctuation as one hyphen, trimmed. */
function slugifyHeading(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export const remarkHeadingIds: Plugin<[], Root> = () => (tree) => {
  const seen = new Map<string, number>();
  visit(tree, "heading", (node: Heading) => {
    const base = slugifyHeading(textOf(node)) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    node.data = {
      ...(node.data ?? {}),
      hProperties: { ...(node.data?.hProperties ?? {}), id },
    };
  });
};
