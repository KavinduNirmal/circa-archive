import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_SCALE,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  describeMatches,
  formatScale,
  matchRanges,
  scaleLimit,
  sectionAnchor,
  sectionIndex,
  stepScale,
  viewLabel,
} from "@/components/reader/reader-model";

/** The count is the number of ranges; spelling it once keeps the tests readable. */
const countMatches = (text: string, query: string) => matchRanges(text, query).length;

describe("reader scale", () => {
  it("steps the text size in tens between eighty and one hundred and sixty", () => {
    expect(stepScale(SCALE_DEFAULT, 1)).toBe(110);
    expect(stepScale(SCALE_DEFAULT, -1)).toBe(90);
    expect(stepScale(SCALE_MIN, 1)).toBe(90);
    expect(stepScale(SCALE_MAX, -1)).toBe(150);
  });

  it("holds the step at each end rather than running past it", () => {
    expect(stepScale(SCALE_MAX, 1)).toBe(SCALE_MAX);
    expect(stepScale(SCALE_MIN, -1)).toBe(SCALE_MIN);
    expect(stepScale(75, 1)).toBe(SCALE_MIN);
  });

  it("reports when a scale button has nothing left to do, so it can say so", () => {
    expect(scaleLimit(SCALE_MAX, 1)).toBe(true);
    expect(scaleLimit(SCALE_MAX, -1)).toBe(false);
    expect(scaleLimit(SCALE_MIN, -1)).toBe(true);
    expect(scaleLimit(SCALE_MIN, 1)).toBe(false);
    expect(scaleLimit(SCALE_DEFAULT, 1)).toBe(false);
  });

  it("prints the scale the way a reader's own readout did", () => {
    expect(formatScale(SCALE_DEFAULT)).toBe("100%");
    expect(formatScale(SCALE_MIN)).toBe("80%");
    expect(formatScale(SCALE_MAX)).toBe("160%");
  });
});

describe("reader vocabulary", () => {
  it("names the three views rather than describing them", () => {
    expect(viewLabel("single")).toBe("Single page");
    expect(viewLabel("continuous")).toBe("Continuous");
    expect(viewLabel("two-up")).toBe("Two-up");
  });

  it("uses a bureaucratic assessment scale instead of stars", () => {
    expect(ASSESSMENT_SCALE).toEqual(["—", "Marginal", "Adequate", "Sound", "Exemplary"]);
    // The first point is the absence of a judgement, not the lowest one.
    expect(ASSESSMENT_SCALE[0]).toBe("—");
  });
});

describe("reader sections", () => {
  it("indexes a section the way a printed page number reads", () => {
    expect(sectionIndex(0)).toBe("01");
    expect(sectionIndex(9)).toBe("10");
    expect(sectionIndex(11)).toBe("12");
  });

  it("anchors a section by id, so the rail and the sheet agree on one name", () => {
    expect(sectionAnchor("field-account")).toBe("reader-section-field-account");
  });
});

describe("reader search", () => {
  it("counts matches without regard to case", () => {
    expect(countMatches("The door. A Door is a door.", "door")).toBe(3);
    expect(countMatches("The door.", "DOOR")).toBe(1);
  });

  it("reports nothing for an empty query or an empty sheet", () => {
    expect(countMatches("The door.", "")).toBe(0);
    expect(countMatches("", "door")).toBe(0);
    expect(countMatches("The door.", "   ")).toBe(0);
  });

  it("reports where each match sits, so the sheet can highlight it", () => {
    expect(matchRanges("a door and a door", "door")).toEqual([{ start: 2, end: 6 }, { start: 13, end: 17 }]);
  });

  it("does not count a match twice when matches overlap", () => {
    expect(matchRanges("aaa", "aa")).toEqual([{ start: 0, end: 2 }]);
  });

  it("treats the query as literal text rather than a pattern", () => {
    expect(countMatches("a.b", ".")).toBe(1);
    expect(countMatches("ab", ".")).toBe(0);
    expect(countMatches("a+b", "+")).toBe(1);
  });

  it("agrees with itself: the count is the number of ranges", () => {
    const text = "Interval. interval, INTERVAL.";
    expect(countMatches(text, "interval")).toBe(matchRanges(text, "interval").length);
  });
});

describe("reader search readout", () => {
  it("says nothing at all until there is a term to look for", () => {
    expect(describeMatches(3, "   ")).toBe("");
  });

  it("counts in the singular and in the plural", () => {
    expect(describeMatches(1, "door plate")).toBe("1 match for door plate.");
    expect(describeMatches(3, "landing")).toBe("3 matches for landing.");
  });

  it("says so plainly when the term is not on the sheet", () => {
    expect(describeMatches(0, "quay")).toBe("No matches for quay.");
  });
});
