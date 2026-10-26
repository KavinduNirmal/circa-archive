import {
  DEFAULT_SEARCH_STATE,
  CUSTODY_STATES,
  DISPLAY_STATUSES,
  RECORD_CLASSES,
  SEARCH_LANGUAGES,
  SEARCH_LIMITS,
  SEARCH_PERIODS,
  SEARCH_SORTS,
  SEARCH_TYPES,
  WARNING_DISCLOSURES,
  WARNING_TAGS,
  WARNING_TIERS,
  type SearchLanguage,
  type SearchState,
  type SearchType,
} from "./contract";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

const FACET_ORDER = {
  type: SEARCH_TYPES,
  class: RECORD_CLASSES,
  status: DISPLAY_STATUSES,
  warn: WARNING_TIERS,
  disclosure: WARNING_DISCLOSURES,
  warnTag: WARNING_TAGS,
} as const;

function values(input: SearchParamsInput, key: string): string[] {
  return (Array.isArray(input[key]) ? input[key] : [input[key]])
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function orderedValues<T extends string>(
  input: SearchParamsInput,
  key: string,
  allowed: readonly T[],
  max = 20,
): T[] {
  const accepted = new Set(
    values(input, key).filter((value) => allowed.includes(value as T)),
  );
  return allowed.filter((value) => accepted.has(value)).slice(0, max);
}

function scalar(input: SearchParamsInput, key: string): string {
  const raw = Array.isArray(input[key]) ? input[key][0] : input[key];
  return (raw ?? "").trim();
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseSearchState(input: SearchParamsInput): SearchState {
  const types = orderedValues(input, "type", SEARCH_TYPES);
  const classes = orderedValues(input, "class", RECORD_CLASSES);
  const legacyClasses = values(input, "class");
  if (legacyClasses.includes("organization") && !types.includes("organization"))
    types.push("organization");

  const rawLanguage = scalar(input, "language") || scalar(input, "lang");
  const rawPage = Number.parseInt(scalar(input, "page"), 10);
  const rawLimit = Number.parseInt(scalar(input, "limit"), 10);
  const rawPeriod = scalar(input, "period");
  const rawSort = scalar(input, "sort");
  const defaultSort =
    scalar(input, "q").trim() || scalar(input, "holder").trim()
      ? "relevance"
      : "newest";
  const from = isDate(scalar(input, "from")) ? scalar(input, "from") : "";
  const to = isDate(scalar(input, "to")) ? scalar(input, "to") : "";
  const reversedDates = Boolean(from && to && from > to);
  const state: SearchState = {
    ...DEFAULT_SEARCH_STATE,
    q: scalar(input, "q").slice(0, 200),
    holder: scalar(input, "holder").slice(0, 120),
    mention: scalar(input, "mention").slice(0, 120),
    org: scalar(input, "org").slice(0, 120),
    author: scalar(input, "author").slice(0, 64),
    tag: scalar(input, "tag").slice(0, 64),
    character: scalar(input, "character").slice(0, 120),
    custody: CUSTODY_STATES.includes(
      scalar(input, "custody") as (typeof CUSTODY_STATES)[number],
    )
      ? scalar(input, "custody")
      : "",
    cursor: /^[A-Za-z0-9_-]{16,2048}$/.test(scalar(input, "cursor"))
      ? scalar(input, "cursor")
      : "",
    types,
    classes,
    statuses: orderedValues(input, "status", DISPLAY_STATUSES),
    warnings: orderedValues(input, "warn", WARNING_TIERS),
    disclosures: orderedValues(input, "disclosure", WARNING_DISCLOSURES),
    warningTags: orderedValues(input, "warnTag", WARNING_TAGS).filter(
      (tag) => !values(input, "excludeWarnTag").includes(tag),
    ),
    excludedWarningTags: orderedValues(input, "excludeWarnTag", WARNING_TAGS),
    period: SEARCH_PERIODS.includes(rawPeriod as SearchState["period"])
      ? (rawPeriod as SearchState["period"])
      : "any",
    from: reversedDates ? "" : from,
    to: reversedDates ? "" : to,
    language: SEARCH_LANGUAGES.includes(rawLanguage as SearchLanguage)
      ? (rawLanguage as SearchLanguage)
      : "en",
    sort: SEARCH_SORTS.includes(rawSort as SearchState["sort"])
      ? (rawSort as SearchState["sort"])
      : defaultSort,
    page: Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100) : 1,
    limit: SEARCH_LIMITS.includes(rawLimit as SearchState["limit"])
      ? (rawLimit as SearchState["limit"])
      : 20,
  };
  // Leave room for the API path, explicit language, and default enabled types.
  for (const key of [
    "cursor",
    "character",
    "tag",
    "author",
    "org",
    "mention",
    "holder",
    "q",
  ] as const) {
    if (toSearchParams(state).toString().length <= 3800) break;
    state[key] = "";
  }
  return state;
}

function appendFacet<T extends string>(
  params: URLSearchParams,
  key: string,
  list: readonly T[],
) {
  for (const value of list) params.append(key, value);
}

export function toSearchParams(state: SearchState): URLSearchParams {
  return serializeSearchParams(state, false);
}

function serializeSearchParams(
  state: SearchState,
  includeLanguage: boolean,
  enabledTypes: readonly SearchType[] = [],
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.holder.trim()) params.set("holder", state.holder.trim());
  if (state.mention.trim()) params.set("mention", state.mention.trim());
  if (state.org.trim()) params.set("org", state.org.trim());
  if (state.author.trim()) params.set("author", state.author.trim());
  if (state.tag.trim()) params.set("tag", state.tag.trim());
  if (state.character.trim()) params.set("character", state.character.trim());
  if (state.custody) params.set("custody", state.custody);
  appendFacet(
    params,
    "type",
    state.types.length ? orderedState(state.types, SEARCH_TYPES) : enabledTypes,
  );
  appendFacet(params, "class", orderedState(state.classes, RECORD_CLASSES));
  appendFacet(params, "status", orderedState(state.statuses, DISPLAY_STATUSES));
  appendFacet(params, "warn", orderedState(state.warnings, WARNING_TIERS));
  appendFacet(
    params,
    "disclosure",
    orderedState(state.disclosures, WARNING_DISCLOSURES),
  );
  appendFacet(params, "warnTag", orderedState(state.warningTags, WARNING_TAGS));
  appendFacet(
    params,
    "excludeWarnTag",
    orderedState(state.excludedWarningTags, WARNING_TAGS),
  );
  if (state.period !== "any") params.set("period", state.period);
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  if (includeLanguage || state.language !== "en")
    params.set("language", state.language);
  const defaultSort =
    state.q.trim() || state.holder.trim() ? "relevance" : "newest";
  if (state.sort !== defaultSort) params.set("sort", state.sort);
  if (!state.cursor && state.page > 1) params.set("page", String(state.page));
  if (state.cursor) params.set("cursor", state.cursor);
  if (state.limit !== 20) params.set("limit", String(state.limit));
  return params;
}

function orderedState<T extends string>(
  items: readonly T[],
  options: readonly T[],
): T[] {
  const selected = new Set(items);
  return options.filter((item) => selected.has(item));
}

export function toApiSearchParams(
  state: SearchState,
  enabledTypes: readonly SearchType[],
): URLSearchParams {
  return serializeSearchParams(state, true, enabledTypes);
}

export function toSearchHref(
  state: SearchState,
  override: Partial<SearchState> = {},
): string {
  const nextState = {
    ...state,
    ...override,
    cursor: override.page === 1 ? "" : (override.cursor ?? state.cursor),
  };
  const params = toSearchParams(nextState);
  const query = params.toString();
  return query ? `/site/records?${query}` : "/site/records";
}

export function formAction(locale: string): string {
  return `/${locale}/site/records`;
}

/** Retain a narrow registry export for form and chip components. */
export const SEARCH_FACET_ORDER = FACET_ORDER;

/** Explain normalization of recognized filters; unknown future keys stay silent. */
export function searchQueryNotices(
  input: SearchParamsInput,
): ("legacy" | "invalid")[] {
  const state = parseSearchState(input);
  const legacyClasses = ["organization", "continuity", "memo"];
  const legacy =
    values(input, "class").some((value) => legacyClasses.includes(value)) ||
    Boolean(scalar(input, "lang"));
  let invalid = Object.entries(FACET_ORDER).some(([key, options]) =>
    values(input, key).some(
      (value) =>
        !["all", "any"].includes(value) &&
        !(options as readonly string[]).includes(value) &&
        !(key === "class" && legacyClasses.includes(value)),
    ),
  );
  const scalarKeys = [
    "q",
    "holder",
    "mention",
    "org",
    "author",
    "tag",
    "character",
    "custody",
    "cursor",
    "from",
    "to",
    "language",
    "sort",
    "period",
    "page",
    "limit",
  ] as const;
  invalid ||= scalarKeys.some(
    (key) => scalar(input, key) && String(state[key]) !== scalar(input, key),
  );
  invalid ||= values(input, "excludeWarnTag").some(
    (tag) => !(WARNING_TAGS as readonly string[]).includes(tag),
  );
  return [
    ...(legacy ? ["legacy" as const] : []),
    ...(invalid ? ["invalid" as const] : []),
  ];
}
