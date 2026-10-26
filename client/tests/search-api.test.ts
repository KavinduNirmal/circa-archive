import { describe, expect, it, vi } from "vitest";
import { isSearchResponse } from "@/lib/search/api";
import { searchFixture } from "@/lib/search/fixture";
import { parseSearchState } from "@/lib/search/query";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ sessionFetch: vi.fn() }));

function responseWithItem() {
  const response = searchFixture(parseSearchState({}));
  return { ...response, items: [{ ...response.items[0] }] };
}

describe("backend search response contract", () => {
  it("accepts absent warning tiers and non-applicable dossier warnings", () => {
    const response = responseWithItem();
    const payload = {
      ...response,
      items: [
        {
          ...response.items[0],
          type: "organization",
          class: null,
          warning: { tier: null, disclosure: null, tags: [] },
        },
      ],
    };
    expect(isSearchResponse(payload)).toBe(true);
  });

  it("accepts a full sealed record for an approved reader", () => {
    const response = responseWithItem();
    response.items[0] = {
      ...response.items[0],
      type: "record",
      class: "exploration",
      status: "sealed",
      access: "sealed",
      redacted: false,
      excerpt: "Approved text",
      highlights: [],
    };
    expect(isSearchResponse(response)).toBe(true);
  });

  it("rejects full sealed incidents and excerpts on redacted rows", () => {
    const response = responseWithItem();
    response.items[0] = {
      ...response.items[0],
      type: "incident",
      status: "sealed",
      access: "sealed",
      redacted: false,
      excerpt: "Hidden text",
      highlights: [],
    };
    expect(isSearchResponse(response)).toBe(false);
    response.items[0] = {
      ...response.items[0],
      type: "record",
      redacted: true,
    };
    expect(isSearchResponse(response)).toBe(false);
  });
});
