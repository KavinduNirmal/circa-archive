"use client";

import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DesktopIcon, type DesktopIconSpec } from "./desktop-icons";

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

type Translate = (key: string, values?: Record<string, string>) => string;

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
  { id: "records", messageKey: "records", ready: true, icon: { glyph: "records" } },
  { id: "my-work", messageKey: "myWork", ready: true, icon: { glyph: "records-work" } },
  { id: "archive", messageKey: "archive", ready: true, icon: { glyph: "archive", shortcut: true } },
  { id: "organizations", messageKey: "organizations", ready: true, icon: { glyph: "organizations" } },
  { id: "inbox", messageKey: "inbox", ready: true, icon: { glyph: "inbox" } },
  { id: "write", messageKey: "word", ready: true, icon: { glyph: "circa-word" } },
  { id: "search", messageKey: "search", ready: true, icon: { glyph: "search" } },
  { id: "expunged", messageKey: "expunged", ready: true, icon: { glyph: "expunged", shortcut: true } },
  { id: "recycle", messageKey: "recycle", ready: true, icon: { glyph: "recycle" } },
] as const satisfies readonly DesktopEntry[];

export type DesktopFolder = (typeof desktopFolders)[number];

/** Locations reachable only from inside My PC. */
export const myPcContents = [
  { id: "system", messageKey: "system", ready: true, icon: { glyph: "system" } },
] as const satisfies readonly DesktopEntry[];

export type MyPcItem = (typeof myPcContents)[number];

export type DesktopDestination = DesktopFolder | MyPcItem;

/** Every destination the shell can name, the desktop rail and My PC contents alike. */
export const allDestinations: readonly DesktopEntry[] = [...desktopFolders, ...myPcContents];

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
function desktopHint(t: Translate, entry: DesktopEntry): string {
  const detail = desktopDetail(t, entry);
  if (!detail) return t("hintFallback");
  // Only a destination that opens a real screen opts in, so the promise stays truthful.
  return entry.ready ? detail : t("hintComingSoon", { detail });
}

export function DesktopNavigation({ onOpen, activeId, compact = false }: {
  onOpen: (entry: DesktopDestination, copy: DesktopCopy, trigger: HTMLButtonElement) => void;
  activeId?: string;
  compact?: boolean;
}) {
  const t = useTranslations("shell");

  return (
    <nav aria-label={t(compact ? "startApplicationsLabel" : "foldersLabel")} className={compact ? "start-navigation" : "desktop-navigation"}>
      {desktopFolders.map((folder) => {
        const copy = desktopCopy(t, folder);
        const shortcut = (
          <button type="button" className="desktop-shortcut" aria-label={copy.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, copy, event.currentTarget)}>
            <DesktopIcon icon={folder.icon} />
            <span>{copy.label}</span>
          </button>
        );
        return compact ? (
          <button key={folder.id} type="button" className="desktop-shortcut" aria-label={copy.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, copy, event.currentTarget)}>
            <DesktopIcon icon={folder.icon} />
            <span>{copy.label}</span>
          </button>
        ) : (
          <Tooltip key={folder.id}>
            <TooltipTrigger asChild>{shortcut}</TooltipTrigger>
            <TooltipContent className="circa-label" side="right" align="center">{desktopHint(t, folder)}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
