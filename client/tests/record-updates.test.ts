import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { FILING_TYPES } from "@/components/reader/reader-correspondence";
import { RECORD_UPDATES, updatesFor } from "@/components/reader/record-updates";

const filedOn = (code: string) => ARCHIVE_INDEX.find((entry) => entry.code === code)?.filed ?? "";

describe("record status updates", () => {
  it("returns a record's updates newest first", () => {
    const updates = updatesFor("CIRCA-S-03007");
    expect(updates.map((update) => update.filed)).toEqual(["2004-09-14", "2004-09-13", "2004-09-12"]);
    expect(updates.some((update) => update.text.includes("severity has been changed"))).toBe(true);
    expect(updates.some((update) => update.text.includes("[Daydream Inc.]"))).toBe(true);
  });

  it("returns nothing for a record with no filed updates", () => {
    expect(updatesFor("INC-00014")).toEqual([]);
    expect(updatesFor("NOT-A-RECORD")).toEqual([]);
  });

  it("files every update on or after the record it updates", () => {
    for (const [code, updates] of Object.entries(RECORD_UPDATES)) {
      const filed = filedOn(code);
      expect(filed, code).not.toBe("");
      for (const update of updates) {
        expect(update.filed >= filed, `${code} ${update.text}`).toBe(true);
      }
    }
  });

  it("keeps status updates off exploration records", () => {
    // Exploration records are accounted for by the parent's exploration count.
    for (const code of Object.keys(RECORD_UPDATES)) {
      expect(FILING_TYPES[code], code).not.toBe("EXPLORATION");
    }
  });

  it("gives every card a tone the surfaces can colour", () => {
    const tones = new Set(["neutral", "changed", "claimed"]);
    for (const [code, updates] of Object.entries(RECORD_UPDATES)) {
      for (const update of updates) {
        expect(tones.has(update.tone), `${code} ${update.text}`).toBe(true);
      }
    }
  });

  it("copies the fixture so a caller cannot reorder it in place", () => {
    expect(updatesFor("CIRCA-S-03007")).not.toBe(RECORD_UPDATES["CIRCA-S-03007"]);
  });
});
