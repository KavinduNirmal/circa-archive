import { ARCHIVE_INDEX } from "../browser/archive-index";
import type { ReaderSection } from "./reader-model";

/**
 * What other people filed against a record.
 *
 * Two things live here, and they are the two halves of the same idea. Notes are
 * marginalia anchored to a section of a record. Follow-ups are the citations
 * between records, which is how the archive is actually navigated: you reach a
 * record because something else referred to it.
 *
 * Both read their facts from the index. A follow-up card is the citing record's
 * own entry rather than a second description of it, and a note that names a
 * section the record does not have is dropped rather than rendered against the
 * wrong one.
 */

/* ------------------------------------------------------------------------- */
/* Annotations                                                                */
/* ------------------------------------------------------------------------- */

/** A reply to a note. Replies do not nest, which is what keeps marginalia legible. */
export type ReaderReply = {
  id: string;
  author: string;
  /** What the margin prints: a relative phrase, or the day itself. */
  when: string;
  body: string;
  noted: number;
};

export type ReaderAnnotation = {
  id: string;
  /** The record the note is filed against. */
  code: string;
  /** The section it hangs beside. */
  sectionId: string;
  author: string;
  when: string;
  /** ISO day, so the rail can order notes without reading their phrasing. */
  filed: string;
  body: string;
  replies: readonly ReaderReply[];
  noted: number;
};

/**
 * The correspondence the preview ships. Five notes across three records, so the
 * rail has a populated case to design against and an empty one everywhere else.
 */
export const ANNOTATIONS: readonly ReaderAnnotation[] = [
  {
    id: "note-00042-field",
    code: "INC-00042",
    sectionId: "field-account",
    author: "M. Okafor",
    when: "2001-03-06",
    filed: "2001-03-06",
    body: "Two of the three climbs were counted by the same officer. The third is the one that matters, and it was counted alone.",
    replies: [],
    noted: 1,
  },
  {
    id: "note-00042-measurement",
    code: "INC-00042",
    sectionId: "measurement",
    author: "R. Adeyemi",
    when: "3 days ago",
    filed: "2001-03-07",
    body: "The east jamb plate is the second one this year. Ask the surveyor which plate he read from before the file closes.",
    replies: [
      {
        id: "reply-00042-measurement",
        author: "H. Kim",
        when: "2 days ago",
        body: "He read from both and reported the difference rather than choosing between them.",
        noted: 2,
      },
    ],
    noted: 4,
  },
  {
    id: "note-00907-readings",
    code: "INC-00907",
    sectionId: "both-readings",
    author: "S. Lindqvist",
    when: "2007-05-21",
    filed: "2007-05-21",
    body: "Eleven minutes is the interval recorded at INC-00027 as well. Nobody has put the two records side by side.",
    replies: [],
    noted: 6,
  },
  {
    id: "note-c005102-charter",
    code: "ORG-C-005102",
    sectionId: "charter",
    author: "Unattributed",
    when: "1994-02-19",
    filed: "1994-02-19",
    body: "The holder asked for the designation to be withheld, then cited the code in three filings of its own. Withholding a name is not the same as declining to be named.",
    replies: [],
    noted: 0,
  },
];

/**
 * The notes from one pool that belong against one record, oldest first.
 *
 * A note whose section is not in front of it is dropped: correspondence can
 * outlive the filing it was written against, and a margin note pinned to the
 * wrong section is worse than one that is not shown. The pool is a parameter
 * because the viewer reads two of them, the preview's own correspondence and
 * whatever the reviewer has filed this session.
 */
export function notesFor(
  pool: readonly ReaderAnnotation[],
  code: string,
  sections: readonly ReaderSection[],
): ReaderAnnotation[] {
  const present = new Set(sections.map((section) => section.id));
  return pool
    .filter((note) => note.code === code && present.has(note.sectionId))
    .slice()
    .sort((a, b) => a.filed.localeCompare(b.filed));
}

/* ------------------------------------------------------------------------- */
/* Follow-up records                                                          */
/* ------------------------------------------------------------------------- */

/** How a follow-up was filed. This is the citing document's type, not the record's class. */
export type FollowUpType = "EXPLORATION" | "DISCOVERY" | "RUMOR";

export const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  EXPLORATION: "Exploration",
  DISCOVERY: "Discovery",
  RUMOR: "Rumor",
};

/**
 * The filing type of every record in the index.
 *
 * Exhaustive on purpose: a card has to print a type, and a default would let a
 * new record silently claim to be a discovery.
 */
export const FILING_TYPES: Record<string, FollowUpType> = {
  "INC-00014": "DISCOVERY",
  "INC-00027": "EXPLORATION",
  "INC-00042": "DISCOVERY",
  "INC-00063": "EXPLORATION",
  "INC-00118": "RUMOR",
  "INC-00204": "RUMOR",
  "INC-00318": "DISCOVERY",
  "INC-00907": "EXPLORATION",
  "ORG-U-000011": "EXPLORATION",
  "ORG-A-020748": "DISCOVERY",
  "ORG-C-005102": "EXPLORATION",
  "CIRCA-R-0438": "RUMOR",
  "EXP-288902": "EXPLORATION",
  "EXP-288903": "DISCOVERY",
  "EVI-035783": "DISCOVERY",
  "EVI-035784": "EXPLORATION",
  "EVI-035785": "RUMOR",
};

/** One citation as filed: the citing record, and the record it names. */
type Citation = { from: string; to: string };

/**
 * The citation web the preview ships. `EVI-035785` is in no edge, so the
 * empty state of the strip is reachable without emptying the index.
 */
const CITATIONS: readonly Citation[] = [
  { from: "INC-00204", to: "INC-00042" },
  { from: "INC-00318", to: "INC-00063" },
  { from: "EVI-035784", to: "ORG-A-020748" },
  { from: "EXP-288903", to: "EXP-288902" },
  { from: "EXP-288902", to: "ORG-C-005102" },
  { from: "INC-00907", to: "INC-00027" },
  { from: "INC-00027", to: "INC-00907" },
  { from: "INC-00063", to: "EVI-035783" },
  { from: "ORG-A-020748", to: "INC-00204" },
  { from: "CIRCA-R-0438", to: "EVI-035784" },
  { from: "INC-00014", to: "INC-00063" },
  { from: "ORG-U-000011", to: "ORG-C-005102" },
  { from: "EVI-035783", to: "ORG-U-000011" },
  { from: "INC-00042", to: "EXP-288902" },
  { from: "ORG-C-005102", to: "EXP-288903" },
  { from: "INC-00042", to: "INC-00014" },
];

/** A citing record, as the strip's card prints it. */
export type ReaderFollowUp = {
  code: string;
  organization: string;
  type: FollowUpType;
  preview: string;
};

function cardFor(code: string): ReaderFollowUp | undefined {
  const entry = ARCHIVE_INDEX.find((item) => item.code === code);
  const type = FILING_TYPES[code];
  if (!entry || !type) return undefined;
  return {
    code: entry.code,
    organization: entry.organization,
    type,
    preview: entry.abstract,
  };
}

/**
 * A record's citations in both directions.
 *
 * `inbound` is what has been filed against this record since: who has been
 * reading it. `outbound` is what this record itself names. They are returned
 * apart because the first is the interesting one, and merging them would hide
 * which way a citation runs.
 */
export function followUpsFor(code: string): {
  inbound: ReaderFollowUp[];
  outbound: ReaderFollowUp[];
} {
  const inbound: ReaderFollowUp[] = [];
  const outbound: ReaderFollowUp[] = [];
  for (const citation of CITATIONS) {
    if (citation.to === code) {
      const card = cardFor(citation.from);
      if (card) inbound.push(card);
    } else if (citation.from === code) {
      const card = cardFor(citation.to);
      if (card) outbound.push(card);
    }
  }
  const filedOn = (code: string) =>
    ARCHIVE_INDEX.find((entry) => entry.code === code)?.filed ?? "";
  const newestFirst = (a: ReaderFollowUp, b: ReaderFollowUp) =>
    filedOn(b.code).localeCompare(filedOn(a.code));
  return {
    inbound: inbound.sort(newestFirst),
    outbound: outbound.sort(newestFirst),
  };
}

/**
 * The records filed against this one that are explorations.
 *
 * An exploration is not a new class: it is the filing type of a record that
 * cites this one. The citation web already says which records were filed
 * against which, so the exploration list is a filter over that web rather than
 * a second relationship kept in step by hand. A discovery is the first contact
 * and a rumor is not an exploration, so neither belongs here.
 */
export function explorationsFor(code: string): ReaderFollowUp[] {
  return followUpsFor(code).inbound.filter(
    (item) => item.type === "EXPLORATION",
  );
}
