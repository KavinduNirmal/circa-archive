/**
 * The record reader's trail, and the operations that move through it.
 *
 * This is deliberately pure: the shell owns when a record is opened, and the
 * URL reconciler needs to move the cursor without rendering the reader. Keeping
 * the trail arithmetic out of React means both paths share one definition of
 * "reopening a record", including the dedupe rule below.
 */

/**
 * The records open in the reader, and where in that list the reader is standing.
 *
 * One record is open at a time in one window; this list is the reader's own
 * Back/Forward history rather than a set of open documents.
 */
export type RecordTrail = { codes: readonly string[]; at: number };

export const EMPTY_TRAIL: RecordTrail = { codes: [], at: 0 };

/** The code the viewer is showing, or `null` when it has been handed nothing. */
export function currentCode(trail: RecordTrail): string | null {
  return trail.codes[trail.at] ?? null;
}

/**
 * A record arriving in the reader.
 *
 * A code already in the trail moves the cursor instead of appending a duplicate,
 * so the same record cannot occupy two history entries and the reader's own Back
 * and Forward stay in agreement with the browser's. Forward entries survive the
 * revisit; only opening a *new* record truncates them.
 */
export function openInTrail(trail: RecordTrail, code: string): RecordTrail {
  if (currentCode(trail) === code) return trail;
  const existing = trail.codes.indexOf(code);
  if (existing >= 0) return { codes: trail.codes, at: existing };
  const codes = [...trail.codes.slice(0, trail.at + 1), code];
  return { codes, at: codes.length - 1 };
}

/** Back (`-1`) and Forward (`1`). Returns the same trail when the step is unavailable. */
export function stepTrail(trail: RecordTrail, delta: 1 | -1): RecordTrail {
  const at = trail.at + delta;
  return at < 0 || at >= trail.codes.length ? trail : { ...trail, at };
}

/**
 * Repairs a trail that arrived from storage.
 *
 * Persisted state is untrusted: an older payload may contain duplicates or a
 * cursor outside the list. This keeps the first visit to each record, points the
 * cursor at the code the reader was showing, and returns an empty trail rather
 * than a trail that points nowhere.
 */
export function normaliseTrail(trail: RecordTrail): RecordTrail {
  const current = currentCode(trail);
  const codes: string[] = [];
  for (const code of trail.codes) {
    if (!codes.includes(code)) codes.push(code);
  }
  if (codes.length === 0) return EMPTY_TRAIL;
  const at =
    current === null
      ? Math.min(Math.max(0, trail.at), codes.length - 1)
      : codes.indexOf(current);
  return { codes, at };
}
