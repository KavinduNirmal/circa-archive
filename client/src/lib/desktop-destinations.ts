import type { DesktopIconSpec } from "@/components/desktop-icons";

/**
 * The workstation's destinations and the copy that names them.
 *
 * Pure data and pure lookups: no hooks, no JSX, no React. The shell renders
 * these, the file browser scopes itself by them, and the server routes derive
 * their static params from the same list — so a shortcut cannot exist without an
 * address, and an address cannot exist without a shortcut.
 */

/**
 * A desktop destination.
 *
 * The label and detail are deliberately absent: they are looked up from the
 * `shell` namespace through `messageKey`, so one entry serves every language and
 * a new shortcut cannot be added with English copy welded to it. The id stays the
 * structural key — CSS hook, React key, test selector, and file-browser scope.
 */
export type DesktopEntry = {
  id: string;
  /** Key stem in the `shell` namespace; `<stem>Label` and `<stem>Detail` are read. */
  messageKey: string;
  /** Set once a destination opens a real screen, so its hint stops promising one. */
  ready?: boolean;
  icon: DesktopIconSpec;
};

/** The copy the shell needs to name a destination in a titlebar or status strip. */
export type DesktopCopy = { label: string; detail: string };

export type Translate = (
  key: string,
  values?: Record<string, string>,
) => string;

/**
 * Desktop shortcuts in reading order: workstation containers first, then the
 * editor, then the archive tools and disposal.
 *
 * Every container here is a folder the file browser can open, so My PC is the
 * workstation root and My Documents, Archive, Organizations, the Recycle Bin,
 * and _EXPUNGED are folders inside it. System lives inside My PC rather than on
 * the desktop, as the reference shell has it.
 */
export const desktopFolders = [
  { id: "my-pc", messageKey: "myPc", ready: true, icon: { glyph: "my-pc" } },
  {
    id: "records",
    messageKey: "records",
    ready: true,
    icon: { glyph: "records" },
  },
  {
    id: "my-work",
    messageKey: "myWork",
    ready: true,
    icon: { glyph: "records-work" },
  },
  {
    id: "archive",
    messageKey: "archive",
    ready: true,
    icon: { glyph: "archive", shortcut: true },
  },
  {
    id: "organizations",
    messageKey: "organizations",
    ready: true,
    icon: { glyph: "organizations" },
  },
  { id: "inbox", messageKey: "inbox", ready: true, icon: { glyph: "inbox" } },
  {
    id: "write",
    messageKey: "word",
    ready: true,
    icon: { glyph: "circa-word" },
  },
  {
    id: "search",
    messageKey: "search",
    ready: true,
    icon: { glyph: "search" },
  },
  {
    id: "expunged",
    messageKey: "expunged",
    ready: true,
    icon: { glyph: "expunged", shortcut: true },
  },
  {
    id: "recycle",
    messageKey: "recycle",
    ready: true,
    icon: { glyph: "recycle" },
  },
] as const satisfies readonly DesktopEntry[];

export type DesktopFolder = (typeof desktopFolders)[number];

/** Locations reachable only from inside My PC. */
export const myPcContents = [
  {
    id: "system",
    messageKey: "system",
    ready: true,
    icon: { glyph: "system" },
  },
] as const satisfies readonly DesktopEntry[];

export type MyPcItem = (typeof myPcContents)[number];

export type DesktopDestination = DesktopFolder | MyPcItem;

/** Every destination the shell can name, the desktop rail and My PC contents alike. */
export const allDestinations: readonly DesktopEntry[] = [
  ...desktopFolders,
  ...myPcContents,
];

const destinationIds = new Set(allDestinations.map((entry) => entry.id));

/** Whether an id names a shortcut the shell can open. Used by routes and the URL mapper. */
export function isDestinationId(id: string): boolean {
  return destinationIds.has(id);
}

/** The shortcut behind an id, or `undefined` when the id is not a destination. */
export function destinationById(id: string): DesktopEntry | undefined {
  return allDestinations.find((entry) => entry.id === id);
}

export function desktopLabel(t: Translate, entry: DesktopEntry): string {
  return t(`${entry.messageKey}Label`);
}

export function desktopDetail(t: Translate, entry: DesktopEntry): string {
  return t(`${entry.messageKey}Detail`);
}

/** Both halves of a destination's copy, read once for a titlebar and a status strip. */
export function desktopCopy(t: Translate, entry: DesktopEntry): DesktopCopy {
  return { label: desktopLabel(t, entry), detail: desktopDetail(t, entry) };
}

/** The Start menu already shows each label inline, so only the desktop rail explains destinations on hover. */
export function desktopHint(t: Translate, entry: DesktopEntry): string {
  const detail = desktopDetail(t, entry);
  if (!detail) return t("hintFallback");
  // Only a destination that opens a real screen opts in, so the promise stays truthful.
  return entry.ready ? detail : t("hintComingSoon", { detail });
}

/**
 * Destinations the file browser hosts.
 *
 * One explorer serves all of them. Each scope is the destination's own id,
 * because the explorer roots its tree at the shortcut that opened it, and this
 * set is what separates a folder from the three applications that bring their own
 * window. Membership is structural, not copy, so it is the same in every
 * language.
 */
export const EXPLORER_SCOPES = new Set([
  "my-pc",
  "records",
  "my-work",
  "archive",
  "organizations",
  "expunged",
  "recycle",
  "system",
]);

/**
 * The name the file browser gives a folder.
 *
 * Two destinations are named differently by the explorer than by the desktop:
 * the workstation root is a computer rather than "My PC", and System is a folder
 * of files rather than a place. Everything else keeps its shortcut name.
 */
export function explorerFolderName(t: Translate, entry: DesktopEntry): string {
  if (entry.id === "my-pc") return t("explorerMyComputer");
  if (entry.id === "system") return t("explorerSystemFiles");
  return desktopLabel(t, entry);
}

/** Explorer is named for the folder it is showing, so the title is composed per destination. */
export function explorerTitle(t: Translate, entry: DesktopEntry): string {
  return `${explorerFolderName(t, entry)} - ${t("explorerSuffix")}`;
}
