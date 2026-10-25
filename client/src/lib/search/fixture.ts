import {
  ARCHIVE_INDEX,
  type ArchiveEntry,
} from "@/components/browser/archive-index";
import {
  SEARCH_ENABLED_TYPES,
  type DisplayStatus,
  type RecordClass,
  type SearchLanguage,
  type SearchLimit,
  type SearchPeriod,
  type SearchSort,
  type SearchState,
  type SearchType,
  type WarningDisclosure,
  type WarningTier,
} from "./contract";

export type SearchResultItem = {
  id: string;
  displayCode: string;
  code: string | null;
  title: string | null;
  excerpt: string | null;
  highlights: { start: number; end: number }[];
  type: SearchType;
  class: "incident" | "exploration" | "evidence" | "rumour" | null;
  status:
    "on-file" | "contested" | "sealed" | "restricted" | "erased" | "tombstoned";
  lifecycle: "on_file" | "erased" | "tombstoned";
  access: "public" | "sealed" | "restricted";
  advisory: "contested" | null;
  filedAt: string;
  warning: {
    tier: WarningTier | null;
    disclosure: WarningDisclosure | null;
    tags: string[];
  };
  holder: { holderCode: string } | null;
  parent: { type: "incident"; code: string; title: string } | null;
  referenceNumber: number | null;
  redacted: boolean;
};

export type SearchResponse = {
  items: SearchResultItem[];
  page: { number: number; size: number; total: number; totalPages: number };
  facets?: Record<string, { value: string; count: number }[]>;
  applied: SearchApplied;
  meta: {
    codeMatch: "exact" | "reserved" | "missing" | "withdrawn" | null;
    holderMatch: "none" | "exact" | "prefix";
    language: "en" | "ko";
  };
};

export type SearchApplied = {
  q: string;
  holder: string | null;
  type: SearchType[];
  class: RecordClass[];
  status: DisplayStatus[];
  warn: WarningTier[];
  disclosure: WarningDisclosure[];
  warnTag: string[];
  excludeWarnTag: string[];
  period: SearchPeriod;
  from: string | null;
  to: string | null;
  language: SearchLanguage;
  sort: SearchSort;
  page: number;
  limit: SearchLimit;
};

export type SearchVocabulary = {
  types: Record<SearchType, string>;
  classes: Record<RecordClass, string>;
  statuses: Record<DisplayStatus, string>;
  warningTiers: Record<WarningTier, string>;
  disclosures: Record<WarningDisclosure, string>;
  warningTags: Record<string, string>;
};

export const DEFAULT_SEARCH_VOCABULARY: SearchVocabulary = {
  types: {
    incident: "Incident",
    record: "Record",
    organization: "Organization",
    character: "Character",
    recovery: "Recovery",
  },
  classes: {
    incident: "Incident",
    exploration: "Exploration",
    evidence: "Evidence",
    rumour: "Rumour",
  },
  statuses: {
    "on-file": "On file",
    contested: "Contested",
    sealed: "Sealed",
    restricted: "Restricted",
    erased: "Erased",
    tombstoned: "Tombstoned",
  },
  warningTiers: { red: "Red", yellow: "Yellow", green: "Green" },
  disclosures: {
    none: "Author chose not to warn",
    "no-warnings-apply": "No warnings apply",
    "not-provided": "Warnings not provided",
  },
  warningTags: {
    "graphic-violence": "Graphic violence",
    "psychological-horror": "Psychological horror",
    "sexual-violence": "Sexual violence",
    "self-harm": "Self-harm",
    "major-character-death": "Major character death",
  },
};

function mapEntry(entry: ArchiveEntry): SearchResultItem {
  const isOrganization = entry.klass === "organization";
  const type: SearchType = isOrganization
    ? "organization"
    : entry.klass === "incident"
      ? "incident"
      : "record";
  // The preview's old status mixed claim state into incidents. Global display
  // status keeps contested advisory state on records only, per the search contract.
  const status =
    entry.searchStatus ??
    (type === "incident" && entry.status === "contested"
      ? "on-file"
      : entry.status);
  const recordClass =
    entry.searchClass ?? (entry.klass === "incident" ? "incident" : null);
  const warningTags = entry.warnings.map(
    (tag) =>
      ({
        violence: "graphic-violence",
        psychological: "psychological-horror",
        sexual: "sexual-violence",
        selfHarm: "self-harm",
        death: "major-character-death",
      })[tag],
  );
  const isSealed = entry.status === "sealed";
  const warningTier: WarningTier =
    entry.searchWarningTier ??
    (warningTags.some((tag) =>
      ["graphic-violence", "sexual-violence", "self-harm"].includes(tag),
    )
      ? "red"
      : warningTags.length
        ? "yellow"
        : "green");
  const disclosure: WarningDisclosure =
    entry.searchDisclosure ??
    (warningTags.length ? "not-provided" : "no-warnings-apply");
  return {
    id: entry.code,
    displayCode: entry.code,
    code: entry.code,
    title: entry.designation ?? "Designation withheld",
    excerpt: isSealed || entry.status === "restricted" ? null : entry.abstract,
    highlights: [],
    type,
    class: recordClass,
    status,
    lifecycle: status === "erased" ? "erased" : "on_file",
    access:
      status === "sealed"
        ? "sealed"
        : status === "restricted"
          ? "restricted"
          : "public",
    advisory: status === "contested" ? "contested" : null,
    filedAt: `${entry.filed}T00:00:00Z`,
    warning: { tier: warningTier, disclosure, tags: warningTags },
    holder: entry.holderCode ? { holderCode: entry.holderCode } : null,
    parent: null,
    referenceNumber: null,
    redacted: isSealed,
  };
}

function periodMatches(date: string, period: SearchState["period"]): boolean {
  if (period === "any") return true;
  if (period === "current") return date >= "2000-01-01";
  if (period === "recent") return date >= "1900-01-01" && date <= "1999-12-31";
  return date < "1900-01-01";
}

export function searchFixture(
  state: SearchState,
  entries: readonly ArchiveEntry[] = ARCHIVE_INDEX,
  vocabulary: SearchVocabulary = DEFAULT_SEARCH_VOCABULARY,
): SearchResponse {
  const query = state.q.trim().toLocaleLowerCase(state.language);
  const holder = state.holder.trim().toLocaleLowerCase();
  const visible = entries
    .map(mapEntry)
    .filter(
      (item) =>
        item.status !== "restricted" &&
        item.status !== "erased" &&
        item.status !== "tombstoned" &&
        (state.types.length === 0
          ? SEARCH_ENABLED_TYPES.includes(
              item.type as (typeof SEARCH_ENABLED_TYPES)[number],
            )
          : state.types.includes(item.type)) &&
        (!state.classes.length ||
          (item.class !== null && state.classes.includes(item.class))) &&
        (!state.statuses.length || state.statuses.includes(item.status)) &&
        (!state.warnings.length ||
          (item.warning.tier !== null &&
            state.warnings.includes(item.warning.tier))) &&
        (!state.disclosures.length ||
          (item.warning.disclosure !== null &&
            state.disclosures.includes(item.warning.disclosure))) &&
        (!state.warningTags.length ||
          state.warningTags.some((tag) => item.warning.tags.includes(tag))) &&
        !state.excludedWarningTags.some((tag) =>
          item.warning.tags.includes(tag),
        ) &&
        periodMatches(item.filedAt.slice(0, 10), state.period) &&
        (!state.from || item.filedAt.slice(0, 10) >= state.from) &&
        (!state.to || item.filedAt.slice(0, 10) <= state.to) &&
        (!holder ||
          (item.holder?.holderCode.toLocaleLowerCase().startsWith(holder) ??
            false)) &&
        (!query ||
          [
            item.code ?? "",
            item.title ?? "",
            vocabulary.types[item.type],
            vocabulary.statuses[item.status],
            item.warning.tier === null
              ? ""
              : vocabulary.warningTiers[item.warning.tier],
            item.warning.disclosure === null
              ? ""
              : vocabulary.disclosures[item.warning.disclosure],
            ...item.warning.tags.map(
              (tag) => vocabulary.warningTags[tag] ?? tag,
            ),
            ...(item.class ? [vocabulary.classes[item.class]] : []),
            ...(item.excerpt ? [item.excerpt] : []),
          ].some((value) =>
            value.toLocaleLowerCase(state.language).includes(query),
          )),
    );

  const sorted = [...visible].sort((a, b) => {
    if (state.sort === "oldest") return a.filedAt.localeCompare(b.filedAt);
    if (state.sort === "title")
      return (a.title ?? "").localeCompare(b.title ?? "");
    if (state.sort === "relevance" && query) {
      const score = (item: SearchResultItem) =>
        Number(item.code?.toLowerCase() === query) * 3 +
        Number(item.title?.toLowerCase().includes(query)) * 2;
      const delta = score(b) - score(a);
      if (delta) return delta;
    }
    return b.filedAt.localeCompare(a.filedAt);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / state.limit));
  const page = Math.min(state.page, pageCount);
  const offset = (page - 1) * state.limit;
  const items = sorted.slice(offset, offset + state.limit);
  const exactCode = query
    ? entries
        .map(mapEntry)
        .find(
          (item) =>
            SEARCH_ENABLED_TYPES.includes(
              item.type as (typeof SEARCH_ENABLED_TYPES)[number],
            ) &&
            item.status !== "restricted" &&
            item.status !== "erased" &&
            item.status !== "tombstoned" &&
            item.code?.toLowerCase() === query,
        )?.code
    : undefined;
  const matchingHolder = holder
    ? sorted.find((item) => item.holder?.holderCode.toLowerCase() === holder)
    : undefined;
  const holderPrefix =
    holder && !matchingHolder
      ? sorted.some((item) =>
          item.holder?.holderCode.toLowerCase().startsWith(holder),
        )
      : false;
  return {
    items: items.map((item) => ({
      ...item,
      highlights:
        item.excerpt && query ? highlightRanges(item.excerpt, query) : [],
    })),
    page: {
      number: page,
      size: state.limit,
      total: sorted.length,
      totalPages: pageCount,
    },
    applied: {
      q: state.q,
      holder: state.holder || null,
      type: state.types,
      class: state.classes,
      status: state.statuses,
      warn: state.warnings,
      disclosure: state.disclosures,
      warnTag: state.warningTags,
      excludeWarnTag: state.excludedWarningTags,
      period: state.period,
      from: state.from || null,
      to: state.to || null,
      language: state.language,
      sort: state.sort,
      page,
      limit: state.limit,
    },
    meta: {
      codeMatch: exactCode
        ? "exact"
        : query && /^[A-Z]+-[A-Z0-9-]+$/i.test(query)
          ? "missing"
          : null,
      holderMatch: matchingHolder ? "exact" : holderPrefix ? "prefix" : "none",
      language: state.language,
    },
  };
}

function highlightRanges(
  text: string,
  query: string,
): { start: number; end: number }[] {
  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase().trim();
  if (!lowerQuery) return [];
  const ranges: { start: number; end: number }[] = [];
  let cursor = 0;
  while (cursor < lowerText.length) {
    const start = lowerText.indexOf(lowerQuery, cursor);
    if (start < 0) break;
    ranges.push({ start, end: start + lowerQuery.length });
    cursor = start + lowerQuery.length;
  }
  return ranges;
}
