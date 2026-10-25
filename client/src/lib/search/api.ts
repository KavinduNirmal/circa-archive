import "server-only";
import { unstable_rethrow } from "next/navigation";
import { sessionFetch } from "@/lib/auth/session";
import { SEARCH_ENABLED_TYPES } from "./contract";
import {
  DISPLAY_STATUSES,
  RECORD_CLASSES,
  SEARCH_PERIODS,
  SEARCH_SORTS,
  SEARCH_TYPES,
  WARNING_DISCLOSURES,
  WARNING_TAGS,
  WARNING_TIERS,
} from "./contract";
import type { SearchState } from "./contract";
import type {
  SearchApplied,
  SearchResponse,
  SearchResultItem,
  SearchVocabulary,
} from "./fixture";
import { searchFixture } from "./fixture";
import { toApiSearchParams } from "./query";

export type SearchOutcome =
  | { status: "success"; response: SearchResponse }
  | { status: "error" | "rate-limited" };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSearchResult(value: unknown): value is SearchResultItem {
  if (!isObject(value)) return false;
  const warning = value.warning;
  const highlightsAreValid =
    Array.isArray(value.highlights) &&
    value.highlights.every(
      (range) =>
        isObject(range) &&
        Number.isInteger(range.start) &&
        Number.isInteger(range.end) &&
        Number(range.start) >= 0 &&
        Number(range.end) >= Number(range.start),
    );
  const warningIsValid =
    isObject(warning) &&
    (warning.tier === null ||
      WARNING_TIERS.includes(warning.tier as (typeof WARNING_TIERS)[number])) &&
    (warning.disclosure === null ||
      WARNING_DISCLOSURES.includes(
        warning.disclosure as (typeof WARNING_DISCLOSURES)[number],
      )) &&
    Array.isArray(warning.tags) &&
    warning.tags.every((tag) =>
      WARNING_TAGS.includes(tag as (typeof WARNING_TAGS)[number]),
    );
  const holderIsValid =
    value.holder === null ||
    (isObject(value.holder) && typeof value.holder.holderCode === "string");
  const parentIsValid =
    value.parent === null ||
    (isObject(value.parent) &&
      typeof value.parent.type === "string" &&
      typeof value.parent.code === "string" &&
      typeof value.parent.title === "string");
  const excerptIsValid =
    (typeof value.excerpt === "string" || value.excerpt === null) &&
    (value.excerpt !== null ||
      !highlightsAreValid ||
      (value.highlights as unknown[]).length === 0);
  const visibilityIsValid =
    value.status !== "restricted" &&
    value.status !== "erased" &&
    value.status !== "tombstoned" &&
    value.access !== "restricted" &&
    value.lifecycle !== "erased" &&
    value.lifecycle !== "tombstoned" &&
    (value.status !== "sealed" ||
      (value.type === "record" && value.redacted === false) ||
      (value.excerpt === null && value.redacted === true)) &&
    (value.redacted !== true || value.excerpt === null);
  return (
    typeof value.id === "string" &&
    typeof value.displayCode === "string" &&
    (typeof value.code === "string" || value.code === null) &&
    (typeof value.title === "string" || value.title === null) &&
    excerptIsValid &&
    visibilityIsValid &&
    highlightsAreValid &&
    SEARCH_TYPES.includes(value.type as (typeof SEARCH_TYPES)[number]) &&
    (value.class === null ||
      RECORD_CLASSES.includes(
        value.class as (typeof RECORD_CLASSES)[number],
      )) &&
    DISPLAY_STATUSES.includes(
      value.status as (typeof DISPLAY_STATUSES)[number],
    ) &&
    typeof value.filedAt === "string" &&
    ["on_file", "erased", "tombstoned"].includes(String(value.lifecycle)) &&
    ["public", "sealed", "restricted"].includes(String(value.access)) &&
    (value.advisory === null || value.advisory === "contested") &&
    warningIsValid &&
    holderIsValid &&
    parentIsValid &&
    (value.referenceNumber === null ||
      Number.isInteger(value.referenceNumber)) &&
    typeof value.redacted === "boolean"
  );
}

function isAppliedSearch(value: unknown): value is SearchApplied {
  if (!isObject(value)) return false;
  const arrays: [string, readonly string[]][] = [
    ["type", SEARCH_TYPES],
    ["class", RECORD_CLASSES],
    ["status", DISPLAY_STATUSES],
    ["warn", WARNING_TIERS],
    ["disclosure", WARNING_DISCLOSURES],
    ["warnTag", WARNING_TAGS],
  ];
  return (
    typeof value.q === "string" &&
    (typeof value.holder === "string" || value.holder === null) &&
    arrays.every(
      ([key, allowed]) =>
        Array.isArray(value[key]) &&
        (value[key] as unknown[]).every((item) =>
          allowed.includes(String(item)),
        ),
    ) &&
    SEARCH_PERIODS.includes(value.period as (typeof SEARCH_PERIODS)[number]) &&
    (typeof value.from === "string" || value.from === null) &&
    (typeof value.to === "string" || value.to === null) &&
    ["en", "ko"].includes(String(value.language)) &&
    SEARCH_SORTS.includes(value.sort as (typeof SEARCH_SORTS)[number]) &&
    Number.isInteger(value.page) &&
    Number(value.page) >= 1 &&
    Number.isInteger(value.limit) &&
    [10, 20, 50].includes(Number(value.limit))
  );
}

export function isSearchResponse(value: unknown): value is SearchResponse {
  if (
    !isObject(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isSearchResult)
  )
    return false;
  if (
    !isObject(value.page) ||
    !isObject(value.meta) ||
    !isAppliedSearch(value.applied)
  )
    return false;
  const facetsAreValid =
    value.facets === undefined ||
    (isObject(value.facets) &&
      Object.values(value.facets).every(
        (facet) =>
          Array.isArray(facet) &&
          facet.every(
            (item) =>
              isObject(item) &&
              typeof item.value === "string" &&
              Number.isInteger(item.count) &&
              Number(item.count) >= 0,
          ),
      ));
  return (
    facetsAreValid &&
    Number.isInteger(value.page.number) &&
    Number.isInteger(value.page.size) &&
    Number.isInteger(value.page.total) &&
    Number.isInteger(value.page.totalPages) &&
    (value.meta.codeMatch === null ||
      ["exact", "reserved", "missing", "withdrawn"].includes(
        String(value.meta.codeMatch),
      )) &&
    ["none", "exact", "prefix"].includes(String(value.meta.holderMatch)) &&
    ["en", "ko"].includes(String(value.meta.language))
  );
}

export async function searchApi(state: SearchState): Promise<SearchOutcome> {
  try {
    const params = toApiSearchParams(state, SEARCH_ENABLED_TYPES);
    const response = await sessionFetch(`/api/v1/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (response.status === 429) return { status: "rate-limited" };
    if (!response.ok) return { status: "error" };
    const payload: unknown = await response.json();
    return isSearchResponse(payload)
      ? { status: "success", response: payload }
      : { status: "error" };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error" };
  }
}

export async function getSearchResults(
  state: SearchState,
  vocabulary?: SearchVocabulary,
): Promise<SearchOutcome> {
  if (process.env.SEARCH_SOURCE === "api") return searchApi(state);
  return {
    status: "success",
    response: searchFixture(state, undefined, vocabulary),
  };
}
