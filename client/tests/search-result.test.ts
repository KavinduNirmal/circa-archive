import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { searchFixture } from "@/lib/search/fixture";
import { searchResultHref } from "@/lib/search/result";
import { parseSearchState } from "@/lib/search/query";

describe("search result destinations", () => {
  it("routes incidents and organizations to existing public pages", () => {
    const [incident] = searchFixture(
      parseSearchState({ type: "incident" }),
    ).items;
    const [organization] = searchFixture(
      parseSearchState({ type: "organization" }),
    ).items;
    expect(searchResultHref(incident)).toBe(`/site/records/${incident.code}`);
    expect(searchResultHref(organization)).toBe(
      `/site/organizations?q=${encodeURIComponent(organization.code ?? "")}`,
    );
  });

  it("routes uncoded rumours to their parent incident anchor", () => {
    const [item] = searchFixture(parseSearchState({ type: "record" }), [
      ARCHIVE_INDEX[0],
    ]).items;
    const rumour = {
      ...item,
      code: null,
      type: "record" as const,
      parent: {
        type: "incident" as const,
        code: "INC-00014",
        title: "Unlogged freight car",
      },
      referenceNumber: 289012,
    };
    expect(searchResultHref(rumour)).toBe(
      "/site/records/INC-00014?tab=rumours#rumour-289012",
    );
  });
});
