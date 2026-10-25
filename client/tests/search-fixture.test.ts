import { describe, expect, it } from "vitest";
import { DEFAULT_SEARCH_VOCABULARY, searchFixture } from "@/lib/search/fixture";
import { parseSearchState } from "@/lib/search/query";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";

describe("fixture global search", () => {
  it("matches type and class as separate filters and paginates", () => {
    const result = searchFixture(
      parseSearchState({ type: "incident", class: "incident" }),
    );
    expect(
      result.items.every(
        (item) => item.type === "incident" && item.class === "incident",
      ),
    ).toBe(true);
    const page = searchFixture(parseSearchState({ limit: "10", page: "2" }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.page.total).toBeGreaterThan(page.items.length);
  });

  it("does not match sealed body text or expose an excerpt", () => {
    const result = searchFixture(
      parseSearchState({ q: "measured, then sealed" }),
    );
    expect(result.items).toHaveLength(0);
  });

  it("omits restricted, erased, and tombstoned metadata from public results", () => {
    const result = searchFixture(parseSearchState({}));
    expect(
      result.items.some((item) =>
        ["restricted", "erased", "tombstoned"].includes(item.status),
      ),
    ).toBe(false);
  });

  it("matches cosmetic holder codes by exact value or prefix only", () => {
    const fixture = [{ ...ARCHIVE_INDEX[0], holderCode: "CIRCA-A-09876" }];
    const prefix = searchFixture(
      parseSearchState({ holder: "circa-a-" }),
      fixture,
    );
    expect(prefix.items[0]?.holder?.holderCode).toBe("CIRCA-A-09876");
    expect(prefix.meta.holderMatch).toBe("prefix");
    const organizationSearch = searchFixture(
      parseSearchState({ holder: "ORG-C-" }),
      fixture,
    );
    expect(organizationSearch.items).toHaveLength(0);
  });

  it("keeps warning disclosure distinct from an empty warning tag list", () => {
    const declined = {
      ...ARCHIVE_INDEX[0],
      warnings: [],
      searchDisclosure: "none" as const,
    };
    const noWarningsApply = {
      ...ARCHIVE_INDEX[1],
      warnings: [],
      searchDisclosure: "no-warnings-apply" as const,
    };
    const notProvided = {
      ...ARCHIVE_INDEX[2],
      warnings: [],
      searchDisclosure: "not-provided" as const,
    };
    for (const disclosure of [
      "none",
      "no-warnings-apply",
      "not-provided",
    ] as const) {
      const result = searchFixture(parseSearchState({ disclosure }), [
        declined,
        noWarningsApply,
        notProvided,
      ]);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.warning.disclosure).toBe(disclosure);
    }
  });

  it("matches localized display vocabulary when Korean search is selected", () => {
    const vocabulary = {
      ...DEFAULT_SEARCH_VOCABULARY,
      statuses: { ...DEFAULT_SEARCH_VOCABULARY.statuses, sealed: "봉인됨" },
    };
    const result = searchFixture(
      parseSearchState({ q: "봉인됨", language: "ko" }),
      undefined,
      vocabulary,
    );
    expect(result.items.some((item) => item.status === "sealed")).toBe(true);
  });

  it("combines separate facets with AND and values within a facet with OR", () => {
    const fixtures = [
      {
        ...ARCHIVE_INDEX[15]!,
        searchClass: "evidence" as const,
        searchStatus: "contested" as const,
      },
      {
        ...ARCHIVE_INDEX[16]!,
        searchClass: "exploration" as const,
        searchStatus: "on-file" as const,
      },
    ];
    const result = searchFixture(
      parseSearchState({
        type: "record",
        class: "evidence,exploration",
        status: "contested",
      }),
      fixtures,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      class: "evidence",
      status: "contested",
    });
  });
});

it("excludes any matching warning tag while retaining included tags", () => {
  const entries = [
    { ...ARCHIVE_INDEX[0], warnings: ["violence" as const] },
    {
      ...ARCHIVE_INDEX[1],
      warnings: ["violence" as const, "selfHarm" as const],
    },
  ];
  const result = searchFixture(
    parseSearchState({
      warnTag: "graphic-violence",
      excludeWarnTag: "self-harm",
    }),
    entries,
  );
  expect(result.items.map((item) => item.code)).toEqual([entries[0].code]);
});
