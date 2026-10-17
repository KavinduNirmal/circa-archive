/**
 * The reader's in-world identity: the name the chrome carries, the handle a
 * reviewer files under, and the numbers the margin prints beside a name.
 *
 * The words this screen uses for things the rest of the world calls by a
 * plainer name — annotations, corroboration, contest, follow-ups, sections —
 * are interface copy, and they live in the `reader` namespace of
 * `messages/en/reader.json` and `messages/ko/reader.json`. The vocabulary is
 * still the point: a reader of a 1999 filing system does not leave comments,
 * cannot upvote, and does not read references; it files annotations,
 * corroborates or contests, and shows the subsequent records. Keeping those
 * words in one catalog is what stops a plain-language synonym from leaking into
 * one label at a time, in either language.
 */

export const READER_NAME = "CIRCA Reader";

/** The window title, which the frame and the taskbar both read. */
export const READER_WINDOW_TITLE = "Record Viewer";

/** The one credential this workstation holds. */
export const REVIEWER_HANDLE = "H. Kim";

/**
 * The user code the margin prints under a display name.
 *
 * A correspondent is a name and a number, the way an archive files people: the
 * name is what they are called, and the number is what they are. The number is
 * what the archive cites when two correspondents share a name, which is why it
 * is printed under the name rather than instead of it.
 *
 * These are stand-ins. They are fixed rather than generated so that a reader
 * sees the same number every time they open the same note, and so the tests can
 * hold a value; when the directory is real this map is what it replaces.
 */
export const USER_CODES: Readonly<Record<string, string>> = {
  "M. Okafor": "481920",
  "R. Adeyemi": "207355",
  "H. Kim": "590412",
  "S. Lindqvist": "734168",
};

/**
 * The code on file for a writer, or nothing.
 *
 * A note can be filed without a writer — an unattributed sheet, or
 * correspondence that outlived the person who wrote it — and an archive that
 * invents a number for those is worse than one that prints none.
 */
export function userCodeFor(author: string): string | null {
  return USER_CODES[author] ?? null;
}
