/**
 * The record reader's model.
 *
 * Everything the viewer's frame needs to decide without looking at a document:
 * the vocabulary its toolbar prints, the scale it steps through, and the two
 * pure measurements it makes of whatever the renderer puts on the sheet. There
 * is no React and no DOM here, so the framing of a record is testable on its own.
 *
 * The content types are deliberately data rather than markup. `reader-window`
 * renders each section through a slot the host supplies, so this module never
 * decides what a paragraph looks like, and the Markdown renderer that will
 * eventually fill the sheet replaces the fitting source rather than the frame.
 */

import type { ArchiveClass, ArchiveStatus } from "../browser/archive-index";

/* ------------------------------------------------------------------------- */
/* View and scale                                                             */
/* ------------------------------------------------------------------------- */

/** Which of the reader's three page arrangements the sheet is using. */
export type ReaderView = "single" | "continuous" | "two-up";

export const READER_VIEWS: readonly ReaderView[] = ["single", "continuous", "two-up"];

const VIEW_LABELS: Record<ReaderView, string> = {
  single: "Single page",
  continuous: "Continuous",
  "two-up": "Two-up",
};

export function viewLabel(view: ReaderView): string {
  return VIEW_LABELS[view];
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
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, current + direction * SCALE_STEP));
}

/** Whether a scale button has nothing left to do, so it can be disabled with a reason. */
export function scaleLimit(current: number, direction: 1 | -1): boolean {
  return direction === 1 ? current >= SCALE_MAX : current <= SCALE_MIN;
}

export function formatScale(scale: number): string {
  return `${scale}%`;
}

/* ------------------------------------------------------------------------- */
/* Reviewer assessment                                                        */
/* ------------------------------------------------------------------------- */

/**
 * The quality scale, as five points of institutional judgement rather than
 * stars. Index 0 is the absence of an assessment, which is what a record that
 * nobody has reviewed reads as.
 */
export const ASSESSMENT_SCALE: readonly string[] = ["—", "Marginal", "Adequate", "Sound", "Exemplary"];

/* ------------------------------------------------------------------------- */
/* Content                                                                    */
/* ------------------------------------------------------------------------- */

/** A run of filed prose, a labelled value, or a body the archive has not released. */
export type ReaderBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "lede"; text: string }
  | { kind: "quote"; text: string; attribution?: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "fields"; rows: readonly { label: string; value: string; mono?: boolean }[] }
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

/** What the toolbar's search readout says, in the reader's own voice. */
export function describeMatches(count: number, query: string): string {
  const term = query.trim();
  if (!term) return "";
  if (count === 0) return `No matches for ${term}.`;
  return `${count} match${count === 1 ? "" : "es"} for ${term}.`;
}
