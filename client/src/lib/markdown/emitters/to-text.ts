import type { List, PhrasingContent, RootContent, Table } from "mdast";
import { parseRecord } from "../pipeline";
import type { RenderInput, RenderResult } from "../types";

/*
 * The plain-text export.
 *
 * This is the target that has to decide what a redaction is worth, and it
 * decides in favour of the record: `||text||` becomes `[REDACTED]` and the
 * withheld words never reach the string. A `.txt` that reveals what the sheet
 * hides would defeat the point of the mark.
 *
 * The table is the only real work. Both stock tools flatten a GFM table into a
 * run of words — `strip-markdown` and `html-to-text` both do — so the table is
 * laid out here: each column padded to its own width, a rule of `-` with `+`
 * junctions, and a cap so one long cell cannot push the measure to the margin.
 *
 * Frontmatter is re-emitted deliberately, as a printed header rather than as
 * raw YAML, because a `.txt` record with no code and no filing date is not a
 * record. Code blocks keep their lines and lose their fences; prose wraps at
 * eighty columns and tables and code do not.
 */

const MEASURE = 80;
const CELL_CAP = 32;
const LABEL_WIDTH = 17;
const REDACTED = "[REDACTED]";

export function renderText(input: RenderInput): RenderResult<string> {
  // The mode is pinned here rather than taken from the caller: an export is not
  // a place where a redaction may be revealed, whatever the viewer was doing.
  const parsed = parseRecord({ ...input, redactionMode: "hidden" });
  const blocks: string[] = [];
  const header = renderMetadata(parsed.metadata);
  if (header) blocks.push(header);
  const body = renderBlocks(parsed.output.children as RootContent[], 0);
  if (body) blocks.push(body);
  return {
    output: `${blocks.join("\n\n").trim()}\n`,
    warnings: parsed.warnings,
  };
}

function renderMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => {
      const label = `${key.replace(/_/g, " ").toUpperCase()}:`.padEnd(
        LABEL_WIDTH,
      );
      const text = Array.isArray(value)
        ? value.join(", ")
        : String(value ?? "");
      return `${label}${text}`;
    })
    .join("\n");
}

function renderBlocks(nodes: readonly RootContent[], depth: number): string {
  return nodes
    .map((node) => renderBlock(node, depth))
    .filter((block) => block.trim() !== "")
    .join("\n\n");
}

function renderBlock(node: RootContent, depth: number): string {
  switch (node.type) {
    case "paragraph":
    case "heading":
      return wrap(inline(node.children));
    case "blockquote":
      return renderBlocks(node.children as RootContent[], depth + 1)
        .split("\n")
        .flatMap((line) => {
          const body = line.trimEnd();
          // The quote marker is part of the measure: a quoted line wraps two
          // columns earlier so the export never runs past eighty.
          if (!body) return [">"];
          return wrap(body, MEASURE - 2)
            .split("\n")
            .map((part) => `> ${part}`);
        })
        .join("\n");
    case "code":
      return node.value;
    case "list":
      return renderList(node, depth);
    case "table":
      return renderTable(node);
    case "figure":
      return wrap(node.caption);
    case "redaction":
      return REDACTED;
    case "thematicBreak":
    case "html":
    case "definition":
    case "yaml":
      return "";
    default:
      return "children" in node
        ? renderBlocks(node.children as RootContent[], depth)
        : "";
  }
}

function renderList(node: List, depth: number): string {
  return node.children
    .map((item, position) => {
      const marker = node.ordered ? `${(node.start ?? 1) + position}. ` : "- ";
      const indent = " ".repeat(marker.length);
      return renderBlocks(item.children as RootContent[], depth + 1)
        .split("\n")
        .map((line, index) =>
          index === 0 ? `${marker}${line}` : `${indent}${line}`,
        )
        .join("\n");
    })
    .join("\n");
}

function renderTable(node: Table): string {
  const rows = node.children.map((row) =>
    row.children.map((cell) =>
      inline(cell.children).replace(/\s+/g, " ").trim(),
    ),
  );
  if (rows.length === 0) return "";
  const columns = Math.max(...rows.map((row) => row.length));
  const widths = Array.from({ length: columns }, (_, column) =>
    Math.min(
      CELL_CAP,
      Math.max(1, ...rows.map((row) => (row[column] ?? "").length)),
    ),
  );
  const line = (cells: readonly string[]) =>
    widths
      .map((width, column) => pad(cells[column] ?? "", width))
      .join("  ")
      .trimEnd();
  const rule = widths.map((width) => "-".repeat(width)).join("-+-");
  const [header, ...rest] = rows;
  return [line(header), rule, ...rest.map(line)].join("\n");
}

function pad(value: string, width: number): string {
  if (value.length > width) return `${value.slice(0, Math.max(0, width - 1))}…`;
  return value.padEnd(width);
}

function inline(nodes: readonly PhrasingContent[]): string {
  return nodes.map(inlineNode).join("");
}

function inlineNode(node: PhrasingContent): string {
  switch (node.type) {
    case "text":
      return node.value;
    case "inlineCode":
      return `\`${node.value}\``;
    case "emphasis":
    case "strong":
    case "delete":
      return inline(node.children);
    case "link":
      return linkLabel(inline(node.children), node.url);
    case "linkReference":
      return inline(node.children);
    case "image":
      return node.alt ?? "";
    case "redaction":
      return REDACTED;
    case "break":
      return " ";
    default:
      return "children" in node
        ? inline((node as { children: PhrasingContent[] }).children)
        : "";
  }
}

/** A label keeps its text; a fragment-only target is not worth printing. */
function linkLabel(label: string, url: string): string {
  if (!url || url === "#" || url.startsWith("#")) return label;
  return `${label} (${url})`;
}

function wrap(text: string, width = MEASURE): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.length <= width) return line;
      const words = line.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let current = "";
      for (const word of words) {
        if (!current) current = word;
        else if (`${current} ${word}`.length <= width) current += ` ${word}`;
        else {
          out.push(current);
          current = word;
        }
      }
      if (current) out.push(current);
      return out.join("\n");
    })
    .join("\n");
}
