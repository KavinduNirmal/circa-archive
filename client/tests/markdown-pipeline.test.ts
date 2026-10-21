import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { parseRecord } from "@/lib/markdown/pipeline";
import type { Figure, Redaction } from "@/lib/markdown/types";
import type { Heading, Image, Root, Table } from "mdast";

const CORPUS = readFileSync(
  resolve(process.cwd(), "public/Ghost_story.md"),
  "utf8",
);

const parsed = parseRecord({ markdown: CORPUS });

function collect<T>(tree: Root, type: string): T[] {
  const found: T[] = [];
  visit(tree, (node) => {
    if (node.type === type) found.push(node as unknown as T);
  });
  return found;
}

const redactionText = (node: Redaction) =>
  node.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("");

describe("record pipeline", () => {
  it("parses the corpus into the headings the plan counts", () => {
    const headings = collect<Heading>(parsed.output, "heading");
    expect(headings.map((heading) => heading.depth)).toEqual([
      1, 2, 2, 2, 2, 3,
    ]);
  });

  it("keeps the YAML block out of the body and hands it over as metadata", () => {
    expect(collect(parsed.output, "yaml")).toHaveLength(0);
    const scalars = Object.entries(parsed.metadata).filter(
      ([, value]) => typeof value === "string",
    );
    expect(scalars).toHaveLength(13);
    expect(parsed.metadata.circa_code).toBe("CIRCA-S-03007");
    expect(parsed.metadata.status).toBe("FILED");
    // The date stays the string the file wrote; parsing it to a Date would lose the day.
    expect(parsed.metadata.filed_date).toBe("2004-09-12");
    expect(parsed.metadata.related).toEqual([
      "INC-00907",
      "INC-00204",
      "CIRCA-R-000441",
    ]);
    expect(parsed.metadata.tags).toHaveLength(5);
  });

  it("would destroy the header without the frontmatter plugin, which is why it is mandatory", () => {
    // Documented defect: parsed without `remark-frontmatter`, the YAML is a rule and loose text.
    const bare = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(CORPUS) as Root;
    expect(bare.children[0].type).toBe("thematicBreak");
  });

  it("resolves every redaction in document order and reports none left behind", () => {
    const redactions = collect<Redaction>(parsed.output, "redaction");
    // Document order: the repaired table cell first, then the three notices.
    expect(redactions.map(redactionText)).toEqual([
      "redacted",
      "redacted",
      "not to be approached",
      "disaster",
      "containment breach",
      "sealed",
    ]);
    expect(
      parsed.warnings.filter(
        (warning) => warning.code === "unmatched-redaction",
      ),
    ).toHaveLength(0);
  });

  it("resolves the redactions inside the table cell the normaliser repaired", () => {
    const table = parsed.output.children.find(
      (node) => node.type === "table",
    ) as Table;
    const cell = table.children[5].children[2];
    const redactions = collect<Redaction>(cell as unknown as Root, "redaction");
    expect(redactions.map(redactionText)).toEqual(["redacted", "redacted"]);
  });

  it("turns the three alignment directives into figures and strips the prefix from the caption", () => {
    const figures = collect<Figure>(parsed.output, "figure");
    // The source is the assertion, so replacing a test image does not fail the pipeline.
    const written = [
      ...CORPUS.matchAll(/!\[(?:right|full|left)\|Figure[^\]]*\]\(([^)]+)\)/g),
    ].map((match) => match[1]);
    expect(figures.map((figure) => figure.align)).toEqual([
      "right",
      "full",
      "left",
    ]);
    expect(figures.map((figure) => figure.url)).toEqual(written);
    for (const figure of figures) {
      expect(figure.caption).toMatch(/^Figure \d\./);
      expect(figure.caption).not.toMatch(/^(right|left|full)\|/);
    }
    // No image survives outside a figure for this document.
    expect(collect<Image>(parsed.output, "image")).toHaveLength(0);
  });

  it("leaves an ordinary image alone rather than inventing an alignment for it", () => {
    const plain = parseRecord({
      markdown: "![A door in a field](./door.jpg)\n",
    });
    expect(collect(plain.output, "figure")).toHaveLength(0);
    expect(collect<Image>(plain.output, "image")).toHaveLength(1);
  });

  it("warns on an alignment word it does not know instead of dropping the image", () => {
    const odd = parseRecord({
      markdown: "![top|Figure 1. A door.](./door.jpg)\n",
    });
    const figures = collect<Figure>(odd.output, "figure");
    expect(figures).toHaveLength(1);
    expect(figures[0].align).toBe("full");
    expect(figures[0].caption).toBe("Figure 1. A door.");
    expect(odd.warnings.map((warning) => warning.code)).toContain(
      "unknown-image-align",
    );
  });

  it("leaves an unmatched delimiter as literal text and says so", () => {
    const odd = parseRecord({
      markdown: "The door is ||not to be approached and that is all.\n",
    });
    expect(collect(odd.output, "redaction")).toHaveLength(0);
    const text = JSON.stringify(odd.output);
    expect(text).toContain("||not to be approached");
    const warnings = odd.warnings.filter(
      (warning) => warning.code === "unmatched-redaction",
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].line).toBe(1);
  });

  it("says so when a record carries no frontmatter, rather than refusing to render", () => {
    const bare = parseRecord({ markdown: "# A record\n\nSome prose.\n" });
    expect(bare.metadata).toEqual({});
    expect(bare.warnings.map((warning) => warning.code)).toContain(
      "metadata-field-missing",
    );
    expect(collect(bare.output, "paragraph")).toHaveLength(1);
  });

  it("flags the disagreement between the header and the body instead of reconciling it", () => {
    // The corpus says `status: FILED` and prints `Status: **OPEN**`. The story is about
    // records that contradict themselves, so the renderer reports it and renders both.
    const warnings = parsed.warnings.filter(
      (warning) => warning.code === "metadata-disagreement",
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toMatch(/FILED/);
    expect(warnings[0].message).toMatch(/OPEN/);
  });

  it("gives repeated headings distinct ids so an anchor is never ambiguous", () => {
    const repeated = parseRecord({
      markdown: "## Field Account\n\nOne.\n\n## Field Account\n\nTwo.\n",
    });
    const ids = collect<Heading>(repeated.output, "heading").map(
      (heading) => heading.data?.hProperties?.id,
    );
    expect(ids).toEqual(["field-account", "field-account-1"]);
  });

  it("numbers image paths against an asset base when one is supplied", () => {
    // The corpus's images are absolute test URLs, so the base behaviour is
    // exercised with a document-relative path rather than by the corpus.
    const hosted = parseRecord({
      markdown: "![right|Figure 1. A door.](./evidence/door.jpg)\n",
      assetBaseUrl: "https://archive.example/records/CIRCA-S-03007/",
    });
    const figures = collect<Figure>(hosted.output, "figure");
    expect(figures[0].url).toBe(
      "https://archive.example/records/CIRCA-S-03007/evidence/door.jpg",
    );
    expect(hosted.warnings.map((warning) => warning.code)).not.toContain(
      "relative-image",
    );
  });
});
