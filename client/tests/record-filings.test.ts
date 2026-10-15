import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX, CLASS_LABELS, STATUS_LABELS } from "@/components/browser/archive-index";
import { READER_HELD_LABEL, recordDocument } from "@/components/reader/record-filings";

/** The records the preview actually files a body for, rather than an entry alone. */
const FILED = ["INC-00014", "INC-00042", "INC-00907", "ORG-C-005102", "CIRCA-S-03007"] as const;

describe("record filings", () => {
  it("builds a sectioned document for every entry in the index", () => {
    for (const entry of ARCHIVE_INDEX) {
      const document = recordDocument(entry.code);
      expect(document, entry.code).toBeDefined();
      expect(document?.code).toBe(entry.code);
      expect(document?.sections.length, entry.code).toBeGreaterThan(2);
    }
  });

  it("has no document at all for a code the index does not carry", () => {
    expect(recordDocument("INC-99999")).toBeUndefined();
    expect(recordDocument("")).toBeUndefined();
  });

  it("carries the entry's own metadata rather than a second copy of it", () => {
    const entry = ARCHIVE_INDEX.find((item) => item.code === "INC-00907");
    const document = recordDocument("INC-00907");
    expect(document?.filed).toBe(entry?.filed);
    expect(document?.organization).toBe(entry?.organization);
    expect(document?.clearance).toBe(entry?.clearance);
    expect(document?.status).toBe(entry?.status);
    expect(document?.klass).toBe(entry?.klass);
    expect(document?.designation).toBe(entry?.designation);
  });

  it("numbers every section and gives it a unique anchor", () => {
    for (const code of FILED) {
      const sections = recordDocument(code)?.sections ?? [];
      const ids = sections.map((section) => section.id);
      expect(new Set(ids).size, code).toBe(ids.length);
      sections.forEach((section, position) => {
        expect(section.index, `${code} ${section.id}`).toBe(String(position + 1).padStart(2, "0"));
        expect(section.id, code).toMatch(/^[a-z0-9-]+$/);
      });
    }
  });

  it("files a real body for the records the preview follows", () => {
    for (const code of FILED) {
      const document = recordDocument(code);
      expect(document?.source, code).toBe("filed");
    }
    const sections = recordDocument("INC-00042")?.sections ?? [];
    expect(sections.map((section) => section.heading)).toContain("Field account");
    // The prose is Markdown the renderer owns, not a block the model re-describes.
    expect(sections.some((section) => section.source?.includes("Three surveyors climbed"))).toBe(true);
  });

  it("files the renderer's corpus, so every feature it carries is reachable in the reader", () => {
    const document = recordDocument("CIRCA-S-03007");
    expect(document?.source).toBe("filed");
    expect(document?.designation).toBe("The Unwalled Door");
    expect(document?.sections.map((section) => section.heading)).toEqual([
      "Brief",
      "Field Account",
      "Cross-Reference",
      "Addendum",
    ]);
    for (const section of document?.sections ?? []) {
      expect(section.source?.length ?? 0, section.heading).toBeGreaterThan(20);
    }
    // The table, the redactions, and the alignment directives are in the source.
    const source = document?.sections.map((section) => section.source).join("\n") ?? "";
    expect(source).toContain("||not to be approached||");
    expect(source).toContain("![right|Figure 1.");
    expect(source).toContain("| S-01 |");
  });

  it("opens each filed record with its index entry, so the sheet never restates the catalogue", () => {
    const document = recordDocument("INC-00042");
    const opening = document?.sections[0];
    const fields = opening?.blocks.find((block) => block.kind === "fields");
    expect(fields && fields.kind === "fields" ? fields.rows.map((row) => row.label) : [])
      .toEqual(["Class", "Filed", "Status", "Filed by", "Clearance"]);
    expect(fields && fields.kind === "fields" ? fields.rows[0].value : "").toBe(CLASS_LABELS.incident);
    expect(fields && fields.kind === "fields" ? fields.rows[2].value : "").toBe(STATUS_LABELS.sealed);
  });

  it("holds the body of a record the archive has not released", () => {
    const document = recordDocument("CIRCA-M-0002");
    expect(document?.source).toBe("held");
    const withheld = document?.sections.filter((section) => section.withheld) ?? [];
    expect(withheld.length).toBeGreaterThan(0);
    for (const section of withheld) {
      expect(section.blocks.map((block) => block.kind)).toEqual(["withheld"]);
      expect(READER_HELD_LABEL).toBeTruthy();
    }
  });

  it("still shows the released entry on a held record, so a code is never a dead end", () => {
    const document = recordDocument("CIRCA-M-0002");
    const opening = document?.sections[0];
    expect(opening?.withheld).toBeFalsy();
    // The entry's abstract is the released body, and it renders as Markdown.
    expect(opening?.source).toBeTruthy();
    expect(opening?.blocks.some((block) => block.kind === "fields")).toBe(true);
  });

  it("withholds one section of a sealed record whose body is otherwise released", () => {
    const sections = recordDocument("INC-00042")?.sections ?? [];
    expect(sections.at(-1)?.withheld).toBe(true);
    // A held section contributes no prose at all, not even to the bundle.
    expect(sections.at(-1)?.source).toBeUndefined();
    expect(sections[0].withheld).toBeFalsy();
  });

  it("names sections in the voice of the class, not a single house template", () => {
    const incident = recordDocument("INC-00014")?.sections.map((section) => section.heading) ?? [];
    const held = recordDocument("INC-00118")?.sections.map((section) => section.heading) ?? [];
    const organization = recordDocument("ORG-C-005102")?.sections.map((section) => section.heading) ?? [];
    expect(incident).toContain("Brief");
    expect(held[0]).toBe("Brief");
    expect(organization[0]).toBe("Charter");
  });

  it("keeps every section's heading short enough for the rail to print", () => {
    for (const entry of ARCHIVE_INDEX) {
      for (const section of recordDocument(entry.code)?.sections ?? []) {
        expect(section.heading.length, `${entry.code} ${section.heading}`).toBeLessThanOrEqual(28);
      }
    }
  });
});
