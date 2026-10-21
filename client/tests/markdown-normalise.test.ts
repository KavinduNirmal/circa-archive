import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normaliseTableRedactions } from "@/lib/markdown/normalise-redactions";
import { parseRecord } from "@/lib/markdown/pipeline";

/**
 * The plan's test corpus, read from `public/` rather than duplicated. The
 * normaliser runs before any parser does, so these tests hold the string it
 * produces, not a rendered document.
 */
const CORPUS = readFileSync(
  resolve(process.cwd(), "public/Ghost_story.md"),
  "utf8",
);

const lines = (text: string) => text.split("\n");

/** Cells are separated by unescaped pipes only; `\|` is text inside a cell. */
function cellCount(row: string): number {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  let cells = 1;
  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] === "\\") {
      index += 1;
      continue;
    }
    if (trimmed[index] === "|") cells += 1;
  }
  return cells;
}

function tableRows(source: string): string[] {
  const found: string[] = [];
  const all = lines(source);
  for (let index = 0; index < all.length; index += 1) {
    // A delimiter row: the table runs from the header above it to the blank line
    // below. A bare `---` is a rule, not a one-column table, so it must hold a pipe.
    if (
      all[index].includes("|") &&
      /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?$/.test(all[index])
    ) {
      found.push(all[index - 1]);
      for (
        let row = index + 1;
        row < all.length && all[row].trim().startsWith("|");
        row += 1
      )
        found.push(all[row]);
      break;
    }
  }
  return found;
}

describe("normaliseTableRedactions", () => {
  it("escapes the redaction delimiter inside the one table row that carries it", () => {
    const normalised = normaliseTableRedactions(CORPUS);
    const before = lines(CORPUS);
    const after = lines(normalised);
    const changed = after
      .map((line, index) => (line === before[index] ? null : index))
      .filter((index) => index !== null);
    // Exactly one line differs, and it is the S-05 row.
    expect(changed).toEqual([46]);
    expect(after[46]).toContain("\\|\\|redacted\\|\\|");
  });

  it("is a no-op on a document with no redaction delimiter at all", () => {
    const plain =
      "# A record\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nNothing hidden here.\n";
    expect(normaliseTableRedactions(plain)).toBe(plain);
  });

  it("leaves a delimiter outside a table byte-identical, because a pipe is not structural there", () => {
    const prose =
      "The door is ||not to be approached|| and that is the whole of it.\n";
    expect(normaliseTableRedactions(prose)).toBe(prose);
  });

  it("repairs the row the parser would otherwise shatter, and leaves the bug visible without it", () => {
    // The bug this exists to prevent: an unescaped `||` is two empty cells.
    const broken = parseRecord({ markdown: CORPUS, normalise: false });
    const brokenRows = broken.output.children.find(
      (node) => node.type === "table",
    );
    expect(
      brokenRows?.type === "table" ? brokenRows.children[5].children.length : 0,
    ).toBe(12);

    const fixed = parseRecord({ markdown: CORPUS });
    const table = fixed.output.children.find((node) => node.type === "table");
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    expect(table.children).toHaveLength(7);
    for (const row of table.children) expect(row.children).toHaveLength(4);
  });

  it("keeps every table row four cells wide in the normalised source", () => {
    for (const row of tableRows(normaliseTableRedactions(CORPUS)))
      expect(cellCount(row)).toBe(4);
  });
});
