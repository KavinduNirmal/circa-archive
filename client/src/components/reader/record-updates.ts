/**
 * Filed status updates, in the archive's own words.
 *
 * An update is a plain sentence, not a document: it is deliberately not
 * Markdown, so nothing here is parsed or rendered as rich text. Each one carries
 * the day it was filed so the history can be ordered, and a tone so a card can
 * carry its colour without the interface inferring one from the wording.
 *
 * Exploration records do not carry updates. They are the records filed against a
 * record, and the parent's status bar accounts for them with an exploration
 * count instead. The test for this module holds that line.
 */

export type RecordUpdateTone = "neutral" | "changed" | "claimed";

export type RecordUpdate = {
  /** ISO day, so string comparison is date comparison. */
  filed: string;
  /** A status sentence; plain text by design. */
  text: string;
  /** What kind of change the sentence reports, so a card can carry its colour. */
  tone: RecordUpdateTone;
};

/**
 * The updates filed against a record. A record with no entry has no history:
 * neither surface then shows a section, which is a real state of the archive.
 */
export const RECORD_UPDATES: Readonly<Record<string, readonly RecordUpdate[]>> = {
  "CIRCA-S-03007": [
    { filed: "2004-09-14", text: "The severity has been changed from A to S.", tone: "changed" },
    { filed: "2004-09-13", text: "[Daydream Inc.] has claimed this record was erased.", tone: "claimed" },
    { filed: "2004-09-12", text: "Filed by H. Kim under CIRCA-S-03007.", tone: "neutral" },
  ],
  "INC-00042": [
    { filed: "2001-03-05", text: "The disposition has been sealed at Level 5.", tone: "changed" },
    { filed: "2001-03-04", text: "The severity has been changed from B to A.", tone: "changed" },
  ],
  "ORG-A-020748": [
    { filed: "1961-03-12", text: "The Commission has claimed this record under the standing commission.", tone: "claimed" },
  ],
};

/**
 * A record's updates, newest first.
 *
 * The array is copied and sorted rather than returned as stored, so a caller can
 * never reorder the fixture by accident.
 */
export function updatesFor(code: string): readonly RecordUpdate[] {
  return [...(RECORD_UPDATES[code] ?? [])].sort((a, b) => b.filed.localeCompare(a.filed));
}
