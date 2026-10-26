import { describe, expect, it } from "vitest";
import {
  parseSearchState,
  toApiSearchParams,
  toSearchParams,
} from "@/lib/search/query";

describe("search query contract", () => {
  it("parses repeated and comma separated facets, dropping invalid values", () => {
    const state = parseSearchState({
      q: "  door  ",
      type: ["record", "incident", "bogus"],
      class: "evidence,exploration,evidence",
      status: ["sealed", "bogus"],
      language: "ko",
      page: "3",
      limit: "50",
    });

    expect(state).toMatchObject({
      q: "door",
      types: ["incident", "record"],
      classes: ["exploration", "evidence"],
      statuses: ["sealed"],
      language: "ko",
      page: 3,
      limit: 50,
    });
  });

  it("serializes canonical repeated keys and omits defaults", () => {
    const params = toSearchParams(
      parseSearchState({
        q: "door",
        type: ["record", "incident"],
        class: ["evidence", "exploration"],
        language: "ko",
      }),
    );

    expect(params.toString()).toBe(
      "q=door&type=incident&type=record&class=exploration&class=evidence&language=ko",
    );
  });

  it("adds enabled types and explicit language to API requests", () => {
    const enabledTypes = ["incident", "record", "organization"] as const;
    const defaults = toApiSearchParams(parseSearchState({}), enabledTypes);
    expect(defaults.getAll("type")).toEqual(enabledTypes);
    expect(defaults.get("language")).toBe("en");
    const params = toApiSearchParams(
      parseSearchState({
        q: "door",
        holder: "CIRCA-A-",
        class: "evidence",
        language: "ko",
      }),
      enabledTypes,
    );
    expect(params.toString()).toBe(
      "q=door&holder=CIRCA-A-&type=incident&type=record&type=organization&class=evidence&language=ko",
    );
  });

  it("drops impossible calendar dates and clamps page bounds", () => {
    expect(
      parseSearchState({ from: "2026-02-31", page: "1000" }),
    ).toMatchObject({
      from: "",
      page: 100,
    });
  });

  it("preserves commas in scalar text while parsing comma-separated facets", () => {
    const state = parseSearchState({
      q: "door, then wall",
      type: "incident,record",
    });
    expect(state.q).toBe("door, then wall");
    expect(state.types).toEqual(["incident", "record"]);
  });
});

it("round trips excluded tags and gives exclusion precedence", () => {
  const state = parseSearchState({
    warnTag: ["graphic-violence", "self-harm"],
    excludeWarnTag: ["self-harm", "invalid"],
  });
  expect(state.warningTags).toEqual(["graphic-violence"]);
  expect(toSearchParams(state).getAll("excludeWarnTag")).toEqual(["self-harm"]);
});

it("drops a reversed date range before calling the strict API", () => {
  const state = parseSearchState({ from: "2026-10-26", to: "2026-10-25" });
  expect(state.from).toBe("");
  expect(state.to).toBe("");
});

it("keeps oversized Unicode URLs within the backend request budget", () => {
  const state = parseSearchState({
    q: "한".repeat(200),
    holder: "한".repeat(120),
    mention: "한".repeat(120),
    org: "한".repeat(120),
    author: "한".repeat(64),
    tag: "한".repeat(64),
    character: "한".repeat(120),
  });
  expect(
    toApiSearchParams(state, [
      "incident",
      "record",
      "organization",
      "character",
      "recovery",
    ]).toString().length,
  ).toBeLessThan(4000);
});

it("reports retired filters and discarded known values", async () => {
  const { searchQueryNotices } = await import("@/lib/search/query");
  expect(searchQueryNotices({ class: "memo", status: "bogus" })).toEqual([
    "legacy",
    "invalid",
  ]);
  expect(searchQueryNotices({ class: "organization" })).toEqual(["legacy"]);
  expect(searchQueryNotices({ q: "door", unknown: "ignored" })).toEqual([]);
});
