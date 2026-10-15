import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GHOST_STORY } from "@/components/reader/ghost-story";
import { RECORD_SOURCES, recordSections, recordSource } from "@/components/reader/record-sources";
import { parseRecord } from "@/lib/markdown/pipeline";

const CORPUS = readFileSync(resolve(process.cwd(), "public/Ghost_story.md"), "utf8");

describe("record sources", () => {
  it("keeps the bundled corpus byte-identical to the file the plan names", () => {
    // The client cannot read a file, so the corpus is bundled as data. This is
    // what stops the copy from drifting away from the file it was taken from.
    expect(GHOST_STORY).toBe(CORPUS);
  });

  it("splits a document into sections at h2 only", () => {
    const sections = recordSections(GHOST_STORY);
    expect(sections.map((section) => section.heading)).toEqual([
      "Brief",
      "Field Account",
      "Cross-Reference",
      "Addendum",
    ]);
    // An h3 belongs to the section it sits in, not to a page of its own.
    expect(sections.at(-1)?.source).toContain("### Filing Metadata");
    for (const section of sections) {
      expect(section.source.startsWith("## "), section.heading).toBe(false);
      expect(section.source.endsWith("---"), section.heading).toBe(false);
    }
  });

  it("does not mistake a heading inside a fence for a section", () => {
    const sections = recordSections("## One\n\n```\n## Not a section\n```\n");
    expect(sections).toHaveLength(1);
    expect(sections[0].source).toContain("## Not a section");
  });

  it("authors every filed body as Markdown the pipeline accepts", () => {
    for (const [code, markdown] of Object.entries(RECORD_SOURCES)) {
      const parsed = parseRecord({ markdown });
      expect(parsed.warnings.filter((warning) => warning.code === "unmatched-redaction"), code).toEqual([]);
      expect(recordSections(markdown).length, code).toBeGreaterThan(1);
    }
  });

  it("returns nothing for a record the preview has not released", () => {
    expect(recordSource("INC-00027")).toBeUndefined();
    expect(recordSource("")).toBeUndefined();
  });
});
