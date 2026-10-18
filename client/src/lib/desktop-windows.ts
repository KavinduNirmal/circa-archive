import type { WindowSpec } from "./desktop-types";
import { destinationById, explorerTitle, type Translate } from "./desktop-destinations";

/**
 * Window specs: the one definition of how a destination or a record is titled.
 *
 * The shell, the URL reconciler, and a restored session all open the same frame,
 * so they must all name it the same way. Before this module the shell composed
 * the title inline, which meant anything else opening a window would have had to
 * copy the composition and could silently disagree with it.
 */

/** Destinations whose application names its own window instead of the explorer. */
const APPLICATION_TITLES: Readonly<Record<string, string>> = {
  search: "browserTitle",
  inbox: "mailTitle",
  write: "wordTitle",
};

/** A destination as a window, or `null` when the id names nothing the shell can open. */
export function specForDestination(id: string, t: Translate): WindowSpec | null {
  const entry = destinationById(id);
  if (!entry) return null;
  const applicationTitle = APPLICATION_TITLES[id];
  if (applicationTitle) {
    // The application prints its own status bar, so the frame drops the generic strip.
    return { id, title: t(applicationTitle), status: null, icon: entry.icon };
  }
  return {
    id,
    title: explorerTitle(t, entry),
    // The explorer does not print a status strip of its own, so the frame carries the location.
    status: t(`${entry.messageKey}Detail`) || t("locationStatus"),
    icon: entry.icon,
  };
}

/**
 * The record reader as a window.
 *
 * It always arrives maximized: a record is the thing you are doing, not a window
 * beside the thing you are doing. The title comes from the caller so the store
 * carries no translated copy.
 */
export function readerWindowSpec(title: string): WindowSpec {
  return { id: "reader", title, status: null, icon: { glyph: "reader" }, maximized: true };
}
