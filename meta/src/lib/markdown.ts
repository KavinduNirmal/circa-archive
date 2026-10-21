import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Heading } from "mdast";
import { documentationPlugins } from "./markdown-plugins";
import { resolveDocLink } from "./documents";
import type { Locale } from "./site";

function textOf(node: { value?: unknown; children?: unknown[] }): string {
  return typeof node.value === "string"
    ? node.value
    : (node.children ?? [])
        .map((child) => textOf(child as typeof node))
        .join("");
}
export async function renderDocument(
  markdown: string,
  path: string,
  locale: Locale,
) {
  const processor = unified().use(remarkParse).use(documentationPlugins);
  const tree = processor.runSync(processor.parse(markdown)) as Root;
  const first = tree.children.find((node) => node.type !== "yaml");
  const titleNode =
    first?.type === "heading" && first.depth === 1 ? first : null;
  const title = titleNode ? textOf(titleNode) : "";
  const headings: { id: string; title: string; depth: number }[] = [];
  visit(tree, "heading", (node: Heading) => {
    if (node.depth === 2 || node.depth === 3) {
      const id = String(node.data?.hProperties?.id);
      headings.push({ id, title: textOf(node), depth: node.depth });
      node.children = [
        { type: "link", url: `#${id}`, children: node.children },
      ];
    }
  });
  tree.children = tree.children.filter((node) => node !== titleNode);
  const opening = tree.children.find((node) => node.type !== "yaml");
  const lead = opening?.type === "paragraph" ? textOf(opening) : "";
  visit(tree, "link", (node) => {
    node.url = resolveDocLink(node.url, path, locale) ?? "";
  });
  visit(tree, "image", (node) => {
    node.url = resolveDocLink(node.url, path, locale, true) ?? "";
  });
  const renderer = unified()
    .use(remarkRehype)
    .use(rehypeSanitize, {
      ...defaultSchema,
      clobberPrefix: "",
      attributes: {
        ...defaultSchema.attributes,
        "*": [
          ...(defaultSchema.attributes?.["*"] ?? []),
          "className",
          "dataAlert",
          "dataBrand",
          "data-alert",
          "data-brand",
        ],
        h2: ["id"],
        h3: ["id"],
      },
      tagNames: [...(defaultSchema.tagNames ?? []), "mark", "aside"],
    })
    .use(rehypeStringify);
  return {
    title,
    lead,
    headings,
    html: renderer.stringify(await renderer.run(tree)),
  };
}
