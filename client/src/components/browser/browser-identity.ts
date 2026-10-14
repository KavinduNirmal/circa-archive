/**
 * The browser's in-world identity.
 *
 * These two names are used by the window title, the menu-less notice titlebars,
 * and the About box. They live in their own module with no imports so the chrome
 * and the notices can both read them: `browser-window` imports the notices, so a
 * notice that imported the window back would leave the copy undefined.
 */

export const BROWSER_NAME = "Titan Browser";

/**
 * The window title. A browser is named after the document it is showing, and
 * this one only ever shows the archive, so the title is fixed for the session.
 */
export const BROWSER_WINDOW_TITLE = `${BROWSER_NAME} - CIRCA Archive`;
