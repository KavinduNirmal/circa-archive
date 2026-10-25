import { describe, expect, it } from "vitest";
import {
  ARCHIVE_INDEX,
  searchArchive,
  type ArchiveEntry,
} from "@/components/browser/archive-index";

const index: readonly ArchiveEntry[] = [
  {
    code: "INC-00014",
    designation: "Unlogged freight car, northbound",
    klass: "incident",
    filed: "1998-06-02",
    status: "on-file",
    organization: "CIRCA",
    clearance: "LEVEL 4",
    abstract: "One car is absent from every copy of the waybill.",
    warnings: [],
  },
  {
    code: "INC-00907",
    designation: "Tide gauge disagreement",
    klass: "incident",
    filed: "2007-05-16",
    status: "contested",
    organization: "ORG-C-005102",
    clearance: "LEVEL 3",
    abstract: "Two stations recorded the same tide eleven minutes apart.",
    warnings: [],
  },
  {
    code: "ORG-C-005102",
    designation: null,
    klass: "organization",
    filed: "1988-07-04",
    status: "on-file",
    organization: "CIRCA",
    clearance: "LEVEL 4",
    abstract: "Filed under seal; the body is listed here for completeness.",
    warnings: [],
  },
  {
    code: "CIRCA-M-0002",
    designation: "Augur ledger, fragment",
    klass: "memo",
    filed: "0100-03-15",
    status: "sealed",
    organization: "CIRCA",
    clearance: "LEVEL 5",
    abstract: "Transcription of a fragment held in cold storage.",
    warnings: [],
  },
];

describe("archive index search", () => {
  it("matches a term across the code, designation, organization, and abstract", () => {
    const codes = (query: string) =>
      searchArchive({ text: query, klass: "all", period: "any" }, index).map(
        (entry) => entry.code,
      );
    expect(codes("freight")).toEqual(["INC-00014"]);
    expect(codes("00014")).toEqual(["INC-00014"]);
    // An exact code match outranks the entry that only mentions the code.
    expect(codes("ORG-C-005102")).toEqual(["ORG-C-005102", "INC-00907"]);
    expect(codes("waybill")).toEqual(["INC-00014"]);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(
      searchArchive(
        { text: "  FREIGHT  ", klass: "all", period: "any" },
        index,
      ).map((entry) => entry.code),
    ).toEqual(["INC-00014"]);
  });

  it("returns every entry in the period when the query is empty", () => {
    expect(
      searchArchive({ text: "", klass: "all", period: "any" }, index),
    ).toHaveLength(index.length);
  });

  it("filters by class", () => {
    expect(
      searchArchive({ text: "", klass: "incident", period: "any" }, index).map(
        (entry) => entry.code,
      ),
    ).toEqual(["INC-00907", "INC-00014"]);
    expect(
      searchArchive({ text: "", klass: "memo", period: "any" }, index).map(
        (entry) => entry.code,
      ),
    ).toEqual(["CIRCA-M-0002"]);
  });

  it("filters by filed period against the ISO date", () => {
    const inPeriod = (period: "current" | "recent" | "historical") =>
      searchArchive({ text: "", klass: "all", period }, index).map(
        (entry) => entry.code,
      );
    expect(inPeriod("current")).toEqual(["INC-00907"]);
    expect(inPeriod("recent")).toEqual(["INC-00014", "ORG-C-005102"]);
    expect(inPeriod("historical")).toEqual(["CIRCA-M-0002"]);
  });

  it("ranks a code match above a text match, then newest filing first", () => {
    const codes = searchArchive(
      { text: "005102", klass: "all", period: "any" },
      index,
    ).map((entry) => entry.code);
    expect(codes[0]).toBe("ORG-C-005102");
    expect(codes[1]).toBe("INC-00907");
  });

  it("orders an unfiltered listing by filing date, newest first", () => {
    expect(
      searchArchive({ text: "", klass: "all", period: "any" }, index).map(
        (entry) => entry.filed,
      ),
    ).toEqual(["2007-05-16", "1998-06-02", "1988-07-04", "0100-03-15"]);
  });

  it("keeps a withheld designation out of the searchable text", () => {
    expect(
      searchArchive(
        { text: "standing commission", klass: "all", period: "any" },
        index,
      ),
    ).toHaveLength(0);
    expect(index[2].designation).toBeNull();
  });

  it("ships a fixture whose codes follow the documented archive formats", () => {
    for (const entry of ARCHIVE_INDEX) {
      // A record code is `CIRCA-{Type}-{Number}`, so the type letter is open.
      expect(entry.code, entry.code).toMatch(
        /^(INC-\d{5}|ORG-[USABCD]-\d{6}(\/C\d)?|CIRCA-[A-Z]-\d{4,5}|CIRCA-ID-\d{4})$/,
      );
      expect(entry.filed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.abstract.length).toBeGreaterThan(20);
    }
    // The page advertises its own size, so the fixture must hold more than one class.
    expect(
      new Set(ARCHIVE_INDEX.map((entry) => entry.klass)).size,
    ).toBeGreaterThan(2);
    expect(ARCHIVE_INDEX.length).toBeGreaterThanOrEqual(12);
  });
});
