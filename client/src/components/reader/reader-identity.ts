/**
 * The reader's in-world identity: the name the chrome carries, the handle a
 * reviewer files under, and the words this screen uses for things the rest of
 * the world calls by a plainer name.
 *
 * The vocabulary is the point of the file. A reader of a 1999 filing system
 * does not leave comments, cannot upvote, and does not read references; it
 * files annotations, corroborates or contests, and shows the subsequent
 * records. Keeping those words in one place is what stops a plain-language
 * synonym from leaking into one label at a time.
 */

export const READER_NAME = "CIRCA Reader";

/** The window title, which the frame and the taskbar both read. */
export const READER_WINDOW_TITLE = "Record Viewer";

/** The one credential this workstation holds. */
export const REVIEWER_HANDLE = "H. Kim";

export const READER_VOCABULARY = {
  /** Comments. */
  annotations: "Annotations",
  notePlaceholder: "File a note.",
  assessment: "Reviewer Assessment",
  /** Upvote. */
  corroborate: "Corroborate",
  /** Downvote. */
  contest: "Contest",
  /** Liking a note. */
  noted: "Noted",
  /** The references footer. */
  followUps: "Subsequent Records",
  filedAgainst: "Filed against this record",
  citedIn: "Cited in this record",
  sections: "Sections",
  scale: "Scale",
  fitToMargin: "Fit to margin",
  emptyMargin: "No annotations filed.",
  emptyMarginNote: "Correspondents may add notes below.",
  emptyFollowUps: "No follow-up records filed.",
  fixture: "Preview record",
} as const;
