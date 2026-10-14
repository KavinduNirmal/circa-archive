/**
 * The mail client's in-world identity.
 *
 * Its own module with no imports, for the same reason the browser has one: the
 * chrome and the notices both read these names, and importing each other back
 * would leave the copy undefined.
 */

export const MAIL_NAME = "Titan Mail";

/**
 * The window title. A mail client is named for the store it opens, and this one
 * only opens the terminal's own correspondence, so the title is fixed.
 */
export const MAIL_WINDOW_TITLE = `${MAIL_NAME} - CIRCA Correspondence`;
