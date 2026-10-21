/**
 * The record reader's model.
 *
 * Everything the viewer's frame needs to decide without looking at a document:
 * the vocabulary its toolbar prints, the scale it steps through, and the two
 * pure measurements it makes of whatever the renderer puts on the sheet. There
 * is no React and no DOM here, so the framing of a record is testable on its own.
 *
 * A section's body is Markdown, and that is deliberately not this module's
 * business. `reader-window` renders each section through a slot the host
 * supplies, so the frame never decides what a paragraph looks like; the
 * Markdown renderer fills the slot and the frame is unchanged by it.
 */

import type { ArchiveClass, ArchiveStatus } from "../browser/archive-index";

/**
 * A word lookup, in the shape `next-intl`'s `useTranslations` returns.
 *
 * The model holds the structure — which arrangements, which faces, which sizes,
 * which points on the scale — and the catalogs in `messages/{en,ko}/reader.json`
 * hold the words for each language. The model never asks what language it is in
 * and never imports React: the frame hands it a translator whenever it asks for
 * a word, so the frame stays the only thing that knows who is reading.
 */
export type ReaderTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/* ------------------------------------------------------------------------- */
/* View and scale                                                             */
/* ------------------------------------------------------------------------- */

/** Which of the reader's three page arrangements the sheet is using. */
export type ReaderView = "single" | "continuous" | "two-up";

export const READER_VIEWS: readonly ReaderView[] = [
  "single",
  "continuous",
  "two-up",
];

const VIEW_KEYS: Record<ReaderView, string> = {
  single: "viewSingle",
  continuous: "viewContinuous",
  "two-up": "viewTwoUp",
};

export function viewLabel(view: ReaderView, t: ReaderTranslate): string {
  return t(VIEW_KEYS[view]);
}

export const SCALE_MIN = 80;
export const SCALE_MAX = 160;
export const SCALE_STEP = 10;
export const SCALE_DEFAULT = 100;

/**
 * One scale step, held at both ends.
 *
 * A value outside the range snaps into it rather than stepping, so a stored
 * setting from an older reader cannot walk the sheet past its limits.
 */
export function stepScale(current: number, direction: 1 | -1): number {
  if (current < SCALE_MIN) return SCALE_MIN;
  if (current > SCALE_MAX) return SCALE_MAX;
  return Math.min(
    SCALE_MAX,
    Math.max(SCALE_MIN, current + direction * SCALE_STEP),
  );
}

/** Whether a scale button has nothing left to do, so it can be disabled with a reason. */
export function scaleLimit(current: number, direction: 1 | -1): boolean {
  return direction === 1 ? current >= SCALE_MAX : current <= SCALE_MIN;
}

export function formatScale(scale: number): string {
  return `${scale}%`;
}

/** A scale from the Text menu, held at the reader's own limits. */
export function clampScale(value: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
}

/* ------------------------------------------------------------------------- */
/* Document text                                                              */
/* ------------------------------------------------------------------------- */

/**
 * How the record is set, as the reader's own preference.
 *
 * The archive types its filings, so Courier is what a record is set in unless
 * the reader says otherwise; the other three are the faces someone reading for
 * a living would ask for — a screen face, a printed face, and the terminal's
 * own. This is a reading preference rather than a property of the record, so it
 * belongs to the reader and not to the document: switching records keeps it.
 */
export type ReaderFont = "courier" | "sans" | "serif" | "mono";

export const READER_FONTS: readonly ReaderFont[] = [
  "courier",
  "sans",
  "serif",
  "mono",
];

const FONT_KEYS: Record<ReaderFont, string> = {
  courier: "fontCourier",
  sans: "fontSans",
  serif: "fontSerif",
  mono: "fontMono",
};

export function fontLabel(font: ReaderFont, t: ReaderTranslate): string {
  return t(FONT_KEYS[font]);
}

/**
 * The stack each choice resolves to. Every one of them ends in a generic
 * family, because the first three name faces this workstation cannot ship.
 */
export const FONT_STACKS: Record<ReaderFont, string> = {
  courier:
    '"Courier New", Courier, "Nimbus Mono PS", "Liberation Mono", ui-monospace, monospace',
  sans: 'var(--font-sans), "DejaVu Sans", Verdana, sans-serif',
  serif: 'Georgia, "Times New Roman", "Liberation Serif", serif',
  mono: "var(--font-mono), ui-monospace, monospace",
};

/**
 * The sizes the Text menu offers. They are presets over the same value the
 * toolbar's scale buttons step through, rather than a second size of their own:
 * one number, two ways to reach it.
 *
 * `key` names the printed size in the catalogs. The number stays here, because
 * the scale is the reader's own setting rather than a word about it.
 */
export const DOCUMENT_SIZES: readonly { scale: number; key: string }[] = [
  { scale: 80, key: "sizeSmall" },
  { scale: 100, key: "sizeRegular" },
  { scale: 120, key: "sizeLarge" },
  { scale: 140, key: "sizeExtraLarge" },
];

/* ------------------------------------------------------------------------- */
/* Reviewer assessment                                                        */
/* ------------------------------------------------------------------------- */

/**
 * The mark that stands for the absence of a judgement.
 *
 * It is not a word, so it is never looked up in a catalog: it is printed as it
 * stands, in every language, because what it says is that there is nothing to
 * print yet.
 */
export const ASSESSMENT_MARK = "—";

/**
 * The quality scale, as five points of institutional judgement rather than
 * stars. Index 0 is the absence of an assessment, which is what a record that
 * nobody has reviewed reads as; the other four are catalog keys, because the
 * words are the reader's rather than the scale's.
 */
export const ASSESSMENT_SCALE: readonly string[] = [
  ASSESSMENT_MARK,
  "assessmentMarginal",
  "assessmentAdequate",
  "assessmentSound",
  "assessmentExemplary",
];

/** What one point of the assessment scale prints: the mark stands for itself. */
export function assessmentLabel(point: string, t: ReaderTranslate): string {
  return point === ASSESSMENT_MARK ? point : t(point);
}

/**
 * How many of a record's follow-ups the strip will list in one direction.
 *
 * A record can be cited by hundreds of filings, and a reading surface is the
 * wrong place to page through them, so the strip shows the ten most recent and
 * says how many it is holding back. See `reader-references.tsx`.
 */
export const FOLLOW_UP_PREVIEW_LIMIT = 10;

/* ------------------------------------------------------------------------- */
/* Content                                                                    */
/* ------------------------------------------------------------------------- */

/** A labelled value the sheet borrows from the catalogue, or a body the archive holds. */
export type ReaderBlock =
  | {
      kind: "fields";
      rows: readonly { label: string; value: string; mono?: boolean }[];
    }
  | { kind: "withheld"; label: string; note: string };

/**
 * One section of a record, which is what the rail previews and what the sheet
 * anchors to. A section is the unit of navigation, of search, and of
 * marginalia, because a record has sections rather than pages.
 */
export type ReaderSection = {
  /** Stable slug, unique within the record, used for the rail's anchor. */
  id: string;
  /** The printed page number, `01` upward. */
  index: string;
  heading: string;
  /**
   * The section's Markdown body, without its heading. The frame prints the
   * heading itself, because the heading is the section's name rather than its
   * content. Absent when the body is held, and in `blocks` then instead.
   */
  source?: string;
  /** The structural blocks: the borrowed fields, and the withheld state. */
  blocks: readonly ReaderBlock[];
  /** Set when the archive holds this section's body; the rail marks it. */
  withheld?: boolean;
};

/** How much of a record the archive released: the whole filing, or the entry alone. */
export type RecordSource = "filed" | "held";

export type RecordDocument = {
  code: string;
  /** Null when the designation is withheld, which the sheet draws as a redaction. */
  designation: string | null;
  klass: ArchiveClass;
  filed: string;
  status: ArchiveStatus;
  organization: string;
  clearance: string;
  abstract: string;
  sections: readonly ReaderSection[];
  source: RecordSource;
};

/** The printed page number for a section's position. */
export function sectionIndex(position: number): string {
  return String(position + 1).padStart(2, "0");
}

/** The element id a section is anchored by, shared by the rail and the sheet. */
export function sectionAnchor(id: string): string {
  return `reader-section-${id}`;
}

/* ------------------------------------------------------------------------- */
/* Search                                                                     */
/* ------------------------------------------------------------------------- */

export type TextMatch = { start: number; end: number };

/**
 * The name the reader registers its search highlight under.
 *
 * The paint and the stylesheet have to agree on this string: a highlight that
 * is registered but never styled is painted as nothing at all, which is a
 * silent failure — the count would read correctly and no word would be marked.
 * It lives here so the two halves can be held together by a test.
 */
export const READER_MATCH_HIGHLIGHT = "reader-match";

/**
 * Every place the query appears, as offsets into the text it was found in.
 *
 * The query is literal text rather than a pattern, so a reader searching for a
 * full stop finds one; matches do not overlap, so a repeated letter is not
 * counted twice.
 */
export function matchRanges(text: string, query: string): TextMatch[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const haystack = text.toLowerCase();
  const ranges: TextMatch[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    ranges.push({ start: at, end: at + needle.length });
    from = at + needle.length;
  }
  return ranges;
}

/** What the toolbar's search readout says, in the reader's own voice and tongue. */
export function describeMatches(
  count: number,
  query: string,
  t: ReaderTranslate,
): string {
  const term = query.trim();
  if (!term) return "";
  if (count === 0) return t("matchesNone", { term });
  return t("matchesFound", { count, term });
}
