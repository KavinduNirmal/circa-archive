/**
 * The record editor's in-world identity.
 *
 * Its own module with no imports beyond the shared type, for the same reason the
 * browser and the mail client have one: the chrome, the notices, and the window
 * registry all read these names, and importing each other back would leave the
 * copy undefined.
 */

export const WORD_NAME = "CIRCA Word";

/**
 * The window title. A word processor is named after the document in it, and this
 * one only ever holds the record being written, so the title is fixed for the
 * session and the status bar reports where the document would be filed.
 */
export const WORD_WINDOW_TITLE = `${WORD_NAME} - Untitled Record`;

/** The document scales the View menu offers. */
export type TextSize = "small" | "normal" | "large";

/**
 * The catalog key each text size reads its label from.
 *
 * The labels are uppercase and read like every other workstation label on the
 * screen, so they are interface chrome and live in `messages/<locale>/word.json`
 * with the rest of the editor's copy. This record maps a size to its key and
 * keeps the size set where the type declares it; the chrome resolves the key,
 * because a constant here could not be translated and a label is not a brand.
 */
export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  small: "sizeSmall",
  normal: "sizeNormal",
  large: "sizeLarge",
};
