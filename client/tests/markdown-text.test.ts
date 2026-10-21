import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderText } from "@/lib/markdown/emitters/to-text";

const CORPUS = readFileSync(
  resolve(process.cwd(), "public/Ghost_story.md"),
  "utf8",
);
const rendered = renderText({ markdown: CORPUS });
const text = rendered.output;
const lines = text.split("\n");

/** The table's own block, which is allowed to be wider than the measure. */
function tableBlock(): string[] {
  const rule = lines.findIndex((line) => /^-+(\+-+)+$/.test(line.trim()));
  if (rule === -1) return [];
  let end = rule + 1;
  while (end < lines.length && lines[end].trim() !== "") end += 1;
  return lines.slice(rule - 1, end);
}

/** The printed header block, also held to its own measure rather than the prose one. */
function metadataBlock(): string[] {
  const end = lines.indexOf("");
  return end === -1 ? lines : lines.slice(0, end);
}

describe("plain-text export", () => {
  it("re-emits the frontmatter as a printed header rather than raw YAML", () => {
    expect(text).toMatch(/^CIRCA CODE:\s+CIRCA-S-03007$/m);
    expect(text).toMatch(/^STATUS:\s+FILED$/m);
    expect(text).toMatch(/^RELATED:\s+INC-00907, INC-00204, CIRCA-R-000441$/m);
    expect(text).toMatch(
      /^TAGS:\s+door, record-inconsistency, gangwon, daydream-inc, bureau-crossref$/m,
    );
    expect(text).not.toMatch(/^circa_code:/m);
    expect(text).not.toContain("---\ncirca_code");
  });

  it("carries no Markdown syntax through to the export", () => {
    expect(text).not.toContain("|");
    expect(text).not.toContain("**");
    expect(text).not.toMatch(/^#/m);
    expect(text).not.toContain("```");
  });

  it("lays the table out in aligned columns instead of flattening it", () => {
    const block = tableBlock();
    expect(block.length).toBeGreaterThanOrEqual(8);
    expect(block[0]).toContain("Subject");
    expect(block[0]).toContain("Verified?");
    expect(block[1]).toMatch(/^-+(\+-+)+$/);
    // Cells line up because every column is padded to its own width.
    const rows = block.filter((line) => line.startsWith("S-"));
    const positions = rows
      .filter((row) => row.includes("Both"))
      .map((row) => row.indexOf("Both"));
    expect(new Set(positions).size).toBe(1);
    expect(block.some((line) => line.includes("Two birth dates"))).toBe(true);
  });

  it("writes a redaction as a redaction, in every target and not only the paper one", () => {
    expect(text).toContain("[REDACTED]");
    for (const secret of [
      "not to be approached",
      "containment breach",
      "disaster",
    ]) {
      expect(text, secret).not.toContain(secret);
    }
    expect(text).not.toContain("||");
  });

  it("keeps an image's caption and drops its path and its alignment prefix", () => {
    expect(text).toContain(
      "Figure 1. The door, photographed from the south approach, 2004.",
    );
    expect(text).toContain("Figure 3. Registry discrepancy notice, 2004.");
    for (const url of [
      ...CORPUS.matchAll(/!\[(?:right|full|left)\|Figure[^\]]*\]\(([^)]+)\)/g),
    ].map((match) => match[1])) {
      expect(text, url).not.toContain(url);
    }
    expect(text).not.toMatch(/(right|left|full)\|Figure/);
  });

  it("keeps a link's label and never emits a bare fragment as its target", () => {
    expect(text).toContain("INC-00907");
    expect(text).not.toContain("](#)");
    expect(text).not.toContain("(#)");
  });

  it("keeps the notice and the filing block, and drops the renderer's own legend comment", () => {
    expect(text).toContain("NOTICE TO CORRESPONDENTS");
    expect(text).toContain("Administrative instruction 6(b).");
    expect(text).toContain("CLASSIFICATION:  LEVEL 3");
    expect(text).not.toContain("SYNTAX LEGEND");
    expect(text).not.toContain("<!--");
  });

  it("wraps prose at eighty columns and leaves tables and code blocks alone", () => {
    const exempt = new Set([...tableBlock(), ...metadataBlock()]);
    const wide = lines.filter((line) => !exempt.has(line) && line.length > 80);
    expect(wide).toEqual([]);
  });

  it("prints a heading as a line of its own rather than as a marker", () => {
    expect(lines).toContain("Brief");
    expect(lines).toContain("The Unwalled Door");
  });

  it("reports the same content warnings the parse layer found", () => {
    expect(rendered.warnings.map((warning) => warning.code)).toContain(
      "metadata-disagreement",
    );
  });
});
