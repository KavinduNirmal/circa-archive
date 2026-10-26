export const SEARCH_ENABLED_TYPES = [
  "incident",
  "record",
  "organization",
  "character",
  "recovery",
] as const;

export const SEARCH_TYPES = [
  "incident",
  "record",
  "organization",
  "character",
  "recovery",
] as const;
export const RECORD_CLASSES = [
  "incident",
  "exploration",
  "evidence",
  "rumour",
] as const;
export const DISPLAY_STATUSES = [
  "on-file",
  "contested",
  "sealed",
  "restricted",
  "erased",
  "tombstoned",
] as const;
export const WARNING_TIERS = ["red", "yellow", "green"] as const;
export const WARNING_DISCLOSURES = [
  "none",
  "no-warnings-apply",
  "not-provided",
] as const;
export const WARNING_TAGS = [
  "graphic-violence",
  "psychological-horror",
  "sexual-violence",
  "self-harm",
  "major-character-death",
] as const;
export const SEARCH_PERIODS = [
  "any",
  "current",
  "recent",
  "historical",
] as const;
export const SEARCH_SORTS = ["relevance", "newest", "oldest", "title"] as const;
export const SEARCH_LANGUAGES = ["en", "ko"] as const;
export const SEARCH_LIMITS = [10, 20, 50] as const;
export const CUSTODY_STATES = [
  "unknown",
  "unclaimed",
  "claimed",
  "disputed",
  "lost",
  "destroyed",
] as const;

/** Query-backed controls. Added discovery facets register here and in the API validator. */
export const SEARCH_FILTER_REGISTRY = [
  { key: "mention", kind: "text", maxLength: 120 },
  { key: "org", kind: "text", maxLength: 120 },
  { key: "author", kind: "text", maxLength: 64 },
  { key: "tag", kind: "text", maxLength: 64 },
  { key: "character", kind: "text", maxLength: 120 },
  { key: "custody", kind: "select", values: CUSTODY_STATES },
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];
export type EnabledSearchType = (typeof SEARCH_ENABLED_TYPES)[number];
export type RecordClass = (typeof RECORD_CLASSES)[number];
export type DisplayStatus = (typeof DISPLAY_STATUSES)[number];
export type WarningTier = (typeof WARNING_TIERS)[number];
export type WarningDisclosure = (typeof WARNING_DISCLOSURES)[number];
export type WarningTag = (typeof WARNING_TAGS)[number];
export type SearchPeriod = (typeof SEARCH_PERIODS)[number];
export type SearchSort = (typeof SEARCH_SORTS)[number];
export type SearchLanguage = (typeof SEARCH_LANGUAGES)[number];
export type SearchLimit = (typeof SEARCH_LIMITS)[number];

export type SearchState = {
  q: string;
  holder: string;
  mention: string;
  org: string;
  author: string;
  tag: string;
  character: string;
  custody: string;
  cursor: string;
  types: SearchType[];
  classes: RecordClass[];
  statuses: DisplayStatus[];
  warnings: WarningTier[];
  disclosures: WarningDisclosure[];
  warningTags: string[];
  excludedWarningTags: string[];
  period: SearchPeriod;
  from: string;
  to: string;
  language: SearchLanguage;
  sort: SearchSort;
  page: number;
  limit: SearchLimit;
};

export const DEFAULT_SEARCH_STATE: SearchState = {
  q: "",
  holder: "",
  mention: "",
  org: "",
  author: "",
  tag: "",
  character: "",
  custody: "",
  cursor: "",
  types: [],
  classes: [],
  statuses: [],
  warnings: [],
  disclosures: [],
  warningTags: [],
  excludedWarningTags: [],
  period: "any",
  from: "",
  to: "",
  language: "en",
  sort: "newest",
  page: 1,
  limit: 20,
};
