/**
 * The archive index behind the in-world browser.
 *
 * This module is the only place that knows how the internal archive is shaped:
 * the entry vocabulary, the fixture the preview browser searches, and the pure
 * query function the page calls. It holds no React and no presentation, so the
 * matching rules can be tested on their own and the page can stay a view.
 *
 * The fixture is illustrative preview content, not canon. It is deliberately
 * mundane: no organization is named, no incident claims a story, and any body
 * whose designation would name one is withheld as `null` so the page can render
 * it as a redacted cell. Codes and dates follow `PROJECT_CONTEXT.md`.
 */

export type ArchiveClass = "incident" | "organization" | "continuity" | "memo";
export const ARCHIVE_WARNING_TAGS = [
  "violence",
  "psychological",
  "sexual",
  "selfHarm",
  "death",
] as const;
export type ArchiveWarningTag = (typeof ARCHIVE_WARNING_TAGS)[number];
export type ArchiveWarningState = "present" | "author" | "none";
export type ArchiveStatus =
  "on-file" | "contested" | "sealed" | "restricted" | "erased";
export type ArchivePeriod = "any" | "current" | "recent" | "historical";

export type ArchiveEntry = {
  /** Archive code in a documented format (`INC-00000`, `ORG-A-000000`, `CIRCA-R-0000`). */
  code: string;
  /** Withheld designations are `null` and never match a query. */
  designation: string | null;
  klass: ArchiveClass;
  /** Filing date as a zero-padded ISO day, so string comparison is date comparison. */
  filed: string;
  status: ArchiveStatus;
  /** The filing lens: `CIRCA` or the organization code that filed it. */
  organization: string;
  /** Cosmetic holder code only; distinct from the organization that filed the entry. */
  holderCode?: string;
  /** Canonical search metadata where the older reader fixture cannot express it. */
  searchWarningTier?: "red" | "yellow" | "green";
  searchDisclosure?: "none" | "no-warnings-apply" | "not-provided";
  searchClass?: "incident" | "exploration" | "evidence" | "rumour";
  searchStatus?:
    "on-file" | "contested" | "sealed" | "restricted" | "erased" | "tombstoned";
  /** Public discovery relationships used by the fixture search adapter. */
  searchMentions?: readonly string[];
  searchOrganizations?: readonly string[];
  searchAuthor?: string;
  searchTags?: readonly string[];
  searchCharacters?: readonly string[];
  searchCustody?: string;
  clearance: string;
  abstract: string;
  warnings: readonly ArchiveWarningTag[];
  /** True when the author supplied the warning list rather than the archive. */
  warningAuthorSupplied?: boolean;
};

export type ArchiveQuery = {
  text: string;
  klass: ArchiveClass | "all";
  period: ArchivePeriod;
  /**
   * Status is the site's fourth filter; the workstation's search takes three, so
   * this one is optional and `undefined` and `"all"` both mean "no filter".
   */
  status?: ArchiveStatus | "all";
};

/** The one address the local network permits. */
export const ARCHIVE_ADDRESS = "http://archive.circa.local/index.htm";

export const ARCHIVE_CLASSES: readonly ArchiveClass[] = [
  "incident",
  "organization",
  "continuity",
  "memo",
];
export const ARCHIVE_STATUSES: readonly ArchiveStatus[] = [
  "on-file",
  "contested",
  "sealed",
  "restricted",
  "erased",
];
export const ARCHIVE_PERIODS: readonly ArchivePeriod[] = [
  "any",
  "current",
  "recent",
  "historical",
];

export const CLASS_LABELS: Record<ArchiveClass, string> = {
  incident: "Incident",
  organization: "Organization",
  continuity: "Continuity",
  memo: "Memo",
};

export const STATUS_LABELS: Record<ArchiveStatus, string> = {
  "on-file": "On file",
  contested: "Contested",
  sealed: "Sealed",
  restricted: "Restricted",
  erased: "Erased",
};

/**
 * The words a reader sees for an entry's class and status.
 *
 * A class and a status are drawn as words, so a query has to match the words on
 * screen; which language those are is decided above this module, which is why
 * the vocabulary is handed in rather than read from the constants below. Plain
 * strings keep this module free of any rendering concern.
 */
export type ArchiveVocabulary = {
  classes: Record<ArchiveClass, string>;
  statuses: Record<ArchiveStatus, string>;
};

/** What the English interface prints, so a call that names no vocabulary searches what it shows. */
const DEFAULT_VOCABULARY: ArchiveVocabulary = {
  classes: CLASS_LABELS,
  statuses: STATUS_LABELS,
};

export const PERIOD_LABELS: Record<ArchivePeriod, string> = {
  any: "Any time",
  current: "Since 2000",
  recent: "1900 to 1999",
  historical: "Before 1900",
};

const PERIOD_RANGE: Record<Exclude<ArchivePeriod, "any">, [string, string]> = {
  current: ["2000-01-01", "9999-12-31"],
  recent: ["1900-01-01", "1999-12-31"],
  historical: ["0000-01-01", "1899-12-31"],
};

const entry = (
  code: string,
  designation: string | null,
  klass: ArchiveClass,
  filed: string,
  status: ArchiveStatus,
  organization: string,
  clearance: string,
  abstract: string,
  warnings: readonly ArchiveWarningTag[] = [],
  warningAuthorSupplied = false,
): ArchiveEntry => ({
  code,
  designation,
  klass,
  filed,
  status,
  organization,
  clearance,
  abstract,
  warnings,
  warningAuthorSupplied,
});

/** The single colour state the index prints for an entry's warnings. */
export function warningState(entry: ArchiveEntry): ArchiveWarningState {
  if (entry.warnings.length === 0) return "none";
  return entry.warningAuthorSupplied ? "author" : "present";
}

/**
 * Eighteen preview entries spread across four classes and three centuries, so
 * every filter, the no-match recovery, and the record view have something real
 * to work with instead of a decorative empty table.
 *
 * `CIRCA-S-03007` is the Markdown renderer's test corpus, filed here so that
 * the widest exercise of that renderer — frontmatter, a table with redactions
 * in a cell, image alignment directives, a code block — is reachable in the
 * record reader rather than only from a unit test.
 */
export const ARCHIVE_INDEX: readonly ArchiveEntry[] = [
  entry(
    "INC-00014",
    "Unlogged freight car, northbound",
    "incident",
    "1998-06-02",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "One car is absent from every copy of the waybill, and the crew count is complete without it.",
  ),
  entry(
    "INC-00027",
    "Signal repeat interval, eleven hours",
    "incident",
    "1999-01-19",
    "contested",
    "ORG-C-005102",
    "LEVEL 3",
    "Two listening posts logged the same transmission eleven hours apart, spelled identically.",
  ),
  entry(
    "INC-00042",
    "Stairwell interval, repeated landing",
    "incident",
    "2001-03-04",
    "sealed",
    "CIRCA",
    "LEVEL 4",
    "Three separate climbs in one building returned the same landing number. Measured, then sealed.",
    ["psychological"],
  ),
  entry(
    "INC-00063",
    "Registry ledger, page removed before binding",
    "incident",
    "2001-11-22",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "The binding thread passes through the stub of a page that no index lists.",
  ),
  entry(
    "INC-00118",
    null,
    "incident",
    "2003-02-11",
    "restricted",
    "CIRCA",
    "LEVEL 5",
    "The designation is withheld at Level 5. The entry remains listed so the code is not reused.",
    ["sexual", "selfHarm"],
  ),
  entry(
    "INC-00204",
    "Second-hand account, originating file missing",
    "incident",
    "2002-01-08",
    "sealed",
    "ORG-A-020748",
    "LEVEL 3",
    "Filed by a reviewer who read it elsewhere. No originating document was ever produced.",
    ["death"],
    true,
  ),
  entry(
    "INC-00318",
    "Cold storage audit, shelf nine",
    "incident",
    "2004-08-30",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "The audit counted one box more than the shelf manifest and one box less than the room register.",
  ),
  entry(
    "INC-00907",
    "Tide gauge disagreement, two stations",
    "incident",
    "2007-05-16",
    "contested",
    "ORG-C-005102",
    "LEVEL 3",
    "Two stations on the same estuary recorded the same tide eleven minutes apart. Both instruments calibrate.",
  ),
  entry(
    "CIRCA-S-03007",
    "The Unwalled Door",
    "incident",
    "2004-09-12",
    "on-file",
    "Qterw-7-3",
    "LEVEL 3",
    "A free-standing door in a pasture in Gangwon Province, and eleven people whose records disagree with themselves.",
    ["violence", "death"],
  ),
  entry(
    "ORG-U-000011",
    "Temple registry, predecessor body",
    "organization",
    "1000-04-01",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "The earliest body the archive still files under a continuous code. Unrated at promotion.",
  ),
  entry(
    "ORG-A-020748",
    "Standing commission of review",
    "organization",
    "1961-03-12",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "Holds two continuities. Adopts records freely and has never filed a recognition of its own.",
  ),
  entry(
    "ORG-C-005102",
    null,
    "organization",
    "1988-07-04",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "Designation withheld at the holder's request. The code stays resolvable inside the archive.",
  ),
  entry(
    "CIRCA-R-0438",
    "Filing office, unnamed founder",
    "organization",
    "1989-02-20",
    "erased",
    "CIRCA",
    "LEVEL 4",
    "Rejected at coherence review and erased. Records filed under it remain as rumors.",
  ),
  entry(
    "ORG-C-005102/C1",
    "Continuity branch, closed",
    "continuity",
    "1992-02-19",
    "on-file",
    "ORG-C-005102",
    "LEVEL 3",
    "Closed after the last subscribing reader stopped filing. Read-only since 1992.",
  ),
  entry(
    "ORG-C-005102/C2",
    "Continuity branch, forked",
    "continuity",
    "1996-10-05",
    "contested",
    "ORG-C-005102",
    "LEVEL 3",
    "Forked from C1 without a cession record. Both branches claim the earlier filings.",
  ),
  entry(
    "CIRCA-M-0002",
    "Augur ledger, fragment",
    "memo",
    "0100-03-15",
    "sealed",
    "CIRCA",
    "LEVEL 5",
    "Transcription of a fragment held in cold storage. The original hand is not in the archive.",
  ),
  entry(
    "CIRCA-M-0031",
    "Recognition memo, unsigned",
    "memo",
    "1995-04-23",
    "on-file",
    "CIRCA",
    "LEVEL 4",
    "A recognition with no signing body, filed anyway. Retained because the code was already issued.",
  ),
  entry(
    "CIRCA-M-0077",
    "Clearance request, denied",
    "memo",
    "2002-09-17",
    "restricted",
    "CIRCA",
    "LEVEL 5",
    "Denied for cause. The requesting analyst's later filings are filed under a different lens.",
  ),
];

/**
 * Everything the index lets a query match against, lower-cased once per call.
 *
 * The class and status words come from the vocabulary rather than from the
 * constants, so a Korean reader who can see 봉인됨 can also search for it.
 * Filing periods are not part of the haystack: a period is a filter, never a
 * word printed against an entry.
 */
function searchableText(
  item: ArchiveEntry,
  vocabulary: ArchiveVocabulary,
): string {
  return [
    item.code,
    item.designation ?? "",
    item.organization,
    item.abstract,
    vocabulary.classes[item.klass],
    vocabulary.statuses[item.status],
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * A code hit outranks a prose hit, so a pasted archive code lands on the entry
 * it names instead of on every record that merely mentions the code.
 */
function rank(item: ArchiveEntry, text: string): number {
  if (!text) return 0;
  return item.code.toLowerCase().includes(text) ? 2 : 1;
}

/**
 * Filters the index by text, class, and filing period, then orders the result:
 * code hits first, then newest filing first, then archive order. An empty query
 * with no filters lists the whole index, which is what the index links use.
 *
 * `vocabulary` is the language the screen is printed in; it defaults to the
 * English words, so a caller that names none — the English interface, and the
 * model's own tests — searches exactly what it always searched.
 */
export function searchArchive(
  query: ArchiveQuery,
  index: readonly ArchiveEntry[] = ARCHIVE_INDEX,
  vocabulary: ArchiveVocabulary = DEFAULT_VOCABULARY,
): ArchiveEntry[] {
  const text = query.text.trim().toLowerCase();
  const range = query.period === "any" ? null : PERIOD_RANGE[query.period];
  return index
    .filter((item) => query.klass === "all" || item.klass === query.klass)
    .filter(
      (item) =>
        !query.status || query.status === "all" || item.status === query.status,
    )
    .filter(
      (item) => !range || (item.filed >= range[0] && item.filed <= range[1]),
    )
    .filter((item) => !text || searchableText(item, vocabulary).includes(text))
    .map((item, position) => ({ item, position, hit: rank(item, text) }))
    .sort(
      (a, b) =>
        b.hit - a.hit ||
        b.item.filed.localeCompare(a.item.filed) ||
        a.position - b.position,
    )
    .map((ranked) => ranked.item);
}

/** The most recently filed entries, for the index page's own front matter. */
export function recentFilings(
  index: readonly ArchiveEntry[] = ARCHIVE_INDEX,
  count = 5,
): ArchiveEntry[] {
  return [...index]
    .sort((a, b) => b.filed.localeCompare(a.filed))
    .slice(0, count);
}

/** How many entries the index holds for a class, used by the index links. */
export function countClass(
  klass: ArchiveClass,
  index: readonly ArchiveEntry[] = ARCHIVE_INDEX,
): number {
  return index.filter((item) => item.klass === klass).length;
}

/** A short human summary of a query, printed above the result table. */
export function describeQuery(query: ArchiveQuery): string {
  return [
    query.text.trim() ? `Code or term: ${query.text.trim()}` : "Whole index",
    `Class: ${query.klass === "all" ? "All" : CLASS_LABELS[query.klass]}`,
    `Filed: ${PERIOD_LABELS[query.period]}`,
  ].join(" · ");
}
