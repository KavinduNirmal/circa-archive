import type { Blockquote, Parents, PhrasingContent, Root } from "mdast";
import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import { remarkHeadingIds } from "@/lib/markdown/heading-ids-plugin";

/** GitHub alerts and callouts remain readable blockquotes on other Markdown readers. */
export const remarkDocumentationAlerts: Plugin<[], Root> = () => (tree) => {
  visit(tree, "blockquote", (node) => {
    const first = node.children[0];
    if (first?.type !== "paragraph" || first.children[0]?.type !== "text")
      return;
    const text = first.children[0];
    const match = text.value.match(
      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|CALLOUT|INFO)\](?:\n|$)/i,
    );
    if (!match) return;
    text.value = text.value.slice(match[0].length);
    node.data = { hProperties: { "data-alert": match[1].toLowerCase() } };
  });
};

/** Highlighting syntax == Highlight== transforms into <mark> tags. */
export const remarkHighlight: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node, index, parent) => {
    if (
      !node.value ||
      !node.value.includes("==") ||
      index === undefined ||
      !parent ||
      !("children" in parent)
    )
      return;
    const regex = /==\s*([^=\n]+?)\s*==/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const newChildren: PhrasingContent[] = [];

    while ((match = regex.exec(node.value)) !== null) {
      if (match.index > lastIndex) {
        newChildren.push({
          type: "text",
          value: node.value.slice(lastIndex, match.index),
        });
      }
      newChildren.push({
        type: "text",
        data: {
          hName: "mark",
          hProperties: { className: ["meta-doc-highlight"] },
        },
        value: match[1],
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex === 0) return;
    if (lastIndex < node.value.length) {
      newChildren.push({ type: "text", value: node.value.slice(lastIndex) });
    }

    (parent as Parents).children.splice(index, 1, ...(newChildren as never[]));
    return index + newChildren.length;
  });
};

/** Brand callout and brand list blocks transform into structured cards. */
export const remarkBrandBlocks: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node, index, parent) => {
    if (!parent || index === undefined || !("children" in parent)) return;
    const lang = (node.lang || "").toLowerCase();
    const meta = (node.meta || "").toLowerCase();
    const isCallout =
      lang === "brand-callout" ||
      (lang === "brand" && meta.includes("callout"));
    const isList =
      lang === "brand-list" || (lang === "brand" && meta.includes("list"));
    if (!isCallout && !isList) return;

    const innerTree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(node.value) as Root;
    const containerNode: Blockquote = {
      type: "blockquote",
      data: {
        hName: isCallout ? "aside" : "div",
        hProperties: {
          "data-brand": isCallout ? "callout" : "list",
          className: [
            isCallout ? "meta-doc-brand-callout" : "meta-doc-brand-list-grid",
          ],
        },
      },
      children: innerTree.children as Blockquote["children"],
    };

    (parent as Parents).children.splice(index, 1, containerNode as never);
    return index + 1;
  });
};

export const documentationPlugins = [
  remarkGfm,
  remarkFrontmatter,
  remarkBrandBlocks,
  remarkDocumentationAlerts,
  remarkHighlight,
  remarkHeadingIds,
];

export function documentationHeadings(markdown: string) {
  const processor = unified().use(remarkParse).use(documentationPlugins);
  const tree = processor.runSync(processor.parse(markdown)) as Root;
  const headings: { id: string; title: string }[] = [];
  visit(tree, "heading", (node) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    let title = "";
    visit(node, (child) => {
      if (child.type === "text" || child.type === "inlineCode")
        title += child.value;
    });
    headings.push({ id: String(node.data?.hProperties?.id), title });
  });
  return headings;
}

/** Partition after heading IDs are assigned, so the band and article share anchors. */
export const remarkDocumentPart: Plugin<[{ part: "title" | "body" }], Root> =
  ({ part }) =>
  (tree) => {
    const first = tree.children.find((node) => node.type !== "yaml");
    const title =
      first?.type === "heading" && first.depth === 1 ? first : undefined;
    tree.children =
      part === "title"
        ? title
          ? [title]
          : []
        : tree.children.filter((node) => node !== title);
  };

export function hasDocumentTitle(markdown: string) {
  const first = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(markdown)
    .children.find((node) => node.type !== "yaml");
  return first?.type === "heading" && first.depth === 1;
}

export function documentTitle(markdown: string): string | null {
  const first = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(markdown)
    .children.find((node) => node.type !== "yaml");
  if (first?.type === "heading" && first.depth === 1) {
    let title = "";
    visit(first, (child) => {
      if (child.type === "text" || child.type === "inlineCode")
        title += child.value;
    });
    return title.trim();
  }
  return null;
}
