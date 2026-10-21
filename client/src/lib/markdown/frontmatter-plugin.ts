import type { Root, Yaml } from "mdast";
import type { Plugin } from "unified";
import { parse as parseYaml } from "yaml";
import type { RecordMetadata } from "./types";
import { setMetadata, warningBag } from "./validate";

/*
 * The header, taken off the tree and made available as data.
 *
 * This is load-bearing for two reasons. Without `remark-frontmatter` the YAML
 * is not a metadata block at all: it parses as a thematic break followed by
 * loose text, and the record's whole header is destroyed. And a `yaml` node
 * left in the tree reaches the emitters, where the default hast handler turns
 * an unknown node into a `<div>` — raw YAML printed inside the record.
 *
 * So the node is parsed and then removed. Corrupt YAML throws, because a file
 * whose header cannot be read must not render as though it were fine; a record
 * with no header at all renders and warns.
 */

export const remarkFrontmatterData: Plugin<[], Root> = () => (tree, file) => {
  const index = tree.children.findIndex((child) => child.type === "yaml");
  if (index === -1) {
    warningBag(file).push({
      code: "metadata-field-missing",
      message:
        "The record carries no frontmatter block, so its header fields are missing.",
      line: 1,
    });
    setMetadata(file, {});
    return;
  }
  const node = tree.children[index] as Yaml;
  let parsed: unknown;
  try {
    parsed = parseYaml(node.value);
  } catch (error) {
    throw new Error(
      `The record's frontmatter is not valid YAML: ${(error as Error).message}`,
    );
  }
  const metadata: RecordMetadata =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as RecordMetadata)
      : {};
  setMetadata(file, metadata);
  tree.children.splice(index, 1);
};
