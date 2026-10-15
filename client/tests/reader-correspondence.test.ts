import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import {
  ANNOTATIONS,
  FOLLOW_UP_LABELS,
  followUpsFor,
  notesFor,
} from "@/components/reader/reader-correspondence";
import { recordDocument } from "@/components/reader/record-filings";
import { userCodeFor } from "@/components/reader/reader-identity";

const codes = new Set(ARCHIVE_INDEX.map((entry) => entry.code));

describe("annotations", () => {
  it("anchors every seeded note to a section the record actually has", () => {
    for (const note of ANNOTATIONS) {
      const sections = recordDocument(note.code)?.sections ?? [];
      expect(sections.map((section) => section.id), `${note.code} ${note.sectionId}`).toContain(note.sectionId);
    }
  });

  it("keeps replies one level deep, the way marginalia works", () => {
    for (const note of ANNOTATIONS) {
      expect(note.replies.every((reply) => !("replies" in reply)), note.id).toBe(true);
    }
  });

  it("gives each note a distinct identity so an endorsement lands on one of them", () => {
    const ids = ANNOTATIONS.map((note) => note.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ANNOTATIONS.some((note) => note.replies.length > 0)).toBe(true);
  });

  it("returns the notes filed against one record, oldest first", () => {
    const sections = recordDocument("INC-00042")?.sections ?? [];
    const notes = notesFor(ANNOTATIONS, "INC-00042", sections);
    expect(notes.length).toBeGreaterThan(1);
    expect(notes.every((note) => note.code === "INC-00042")).toBe(true);
    const filed = notes.map((note) => note.filed);
    expect([...filed].sort()).toEqual(filed);
  });

  it("drops a note whose section is not in the document in front of it", () => {
    const all = recordDocument("INC-00042")?.sections ?? [];
    const openingOnly = all.slice(0, 1);
    expect(notesFor(ANNOTATIONS, "INC-00042", openingOnly).length).toBeLessThan(notesFor(ANNOTATIONS, "INC-00042", all).length);
    expect(notesFor(ANNOTATIONS, "INC-00042", []).length).toBe(0);
  });

  it("files no notes against a record nobody has annotated", () => {
    const sections = recordDocument("INC-00014")?.sections ?? [];
    expect(notesFor(ANNOTATIONS, "INC-00014", sections)).toEqual([]);
    expect(notesFor(ANNOTATIONS, "INC-00042", recordDocument("INC-00042")?.sections ?? []).length).toBeGreaterThan(0);
  });
});

describe("follow-up records", () => {
  it("labels the three ways a follow-up can be filed", () => {
    expect(FOLLOW_UP_LABELS).toEqual({
      EXPLORATION: "Exploration",
      DISCOVERY: "Discovery",
      RUMOR: "Rumor",
    });
  });

  it("splits a record's citations into the ones filed against it and the ones it files", () => {
    const { inbound, outbound } = followUpsFor("INC-00042");
    expect(inbound.map((card) => card.code)).toContain("INC-00204");
    expect(outbound.map((card) => card.code)).toContain("INC-00014");
    // A citation is one direction only, so no record appears in both lists.
    const both = inbound.filter((card) => outbound.some((other) => other.code === card.code));
    expect(both).toEqual([]);
  });

  it("only ever points at a code the archive index can open", () => {
    for (const entry of ARCHIVE_INDEX) {
      for (const card of [...followUpsFor(entry.code).inbound, ...followUpsFor(entry.code).outbound]) {
        expect(codes.has(card.code), `${entry.code} -> ${card.code}`).toBe(true);
      }
    }
  });

  it("describes a card from the archive's own index entry, not a second copy", () => {
    const card = followUpsFor("INC-00907").inbound.find((item) => item.code === "INC-00027");
    const entry = ARCHIVE_INDEX.find((item) => item.code === "INC-00027");
    expect(card?.organization).toBe(entry?.organization);
    expect(card?.preview).toBe(entry?.abstract);
    expect(card?.type).toBe("EXPLORATION");
  });

  it("reports how many records a code can be reached from, in either direction", () => {
    const reached = (code: string) => {
      const { inbound, outbound } = followUpsFor(code);
      return inbound.length + outbound.length;
    };
    expect(reached("INC-00042")).toBeGreaterThan(0);
    expect(reached("CIRCA-M-0077")).toBe(0);
  });

  it("files nothing against a record nobody has followed up", () => {
    const { inbound, outbound } = followUpsFor("CIRCA-M-0077");
    expect(inbound).toEqual([]);
    expect(outbound).toEqual([]);
  });

  it("has no follow-ups at all for a code the index does not carry", () => {
    expect(followUpsFor("INC-99999")).toEqual({ inbound: [], outbound: [] });
  });
});

describe("correspondent user codes", () => {
  it("issues a six-digit code to every writer the margin can name", () => {
    const writers = [
      ...ANNOTATIONS.map((note) => note.author),
      ...ANNOTATIONS.flatMap((note) => note.replies.map((reply) => reply.author)),
    ];
    for (const writer of writers) {
      if (writer === "Unattributed") continue;
      expect(userCodeFor(writer), writer).toMatch(/^\d{6}$/);
    }
    // Distinct, so the margin never shows two correspondents with one number.
    const codes = writers.filter((writer) => writer !== "Unattributed").map((writer) => userCodeFor(writer));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("issues nothing to a note with no writer, rather than inventing a number", () => {
    expect(userCodeFor("Unattributed")).toBeNull();
    expect(userCodeFor("")).toBeNull();
    expect(userCodeFor("Someone Not In The Directory")).toBeNull();
  });
});
