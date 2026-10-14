"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DesktopIcon, type DesktopIconSpec } from "./desktop-icons";

export type DesktopEntry = {
  /** Stable identifier used for CSS hooks, keys, and test selectors. */
  id: string;
  /** Uppercase-free display name; CSS applies the workstation casing. */
  label: string;
  /** Tooltip and placeholder copy for destinations without content yet. */
  detail: string | null;
  /** Set once a destination opens a real screen, so its hint stops promising one. */
  ready?: boolean;
  icon: DesktopIconSpec;
};

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
  { id: "my-pc", label: "My PC", detail: "Workstation contents", ready: true, icon: { glyph: "my-pc" } },
  { id: "records", label: "My Documents", detail: "Your drafts and filed records", ready: true, icon: { glyph: "records" } },
  { id: "my-work", label: "My Work", detail: "Records and drafts under review", ready: true, icon: { glyph: "records-work" } },
  { id: "archive", label: "Archive", detail: "Incident files and filed records", ready: true, icon: { glyph: "archive", shortcut: true } },
  { id: "organizations", label: "Organizations", detail: "Organization dossiers and continuities", ready: true, icon: { glyph: "organizations" } },
  { id: "inbox", label: "Inbox", detail: "Correspondence and dead letters", ready: true, icon: { glyph: "inbox" } },
  { id: "write", label: "CIRCA Word", detail: "Document editor", icon: { glyph: "circa-word" } },
  { id: "search", label: "Search", detail: "Search the internal archive index", ready: true, icon: { glyph: "search" } },
  { id: "expunged", label: "_EXPUNGED", detail: "The archive of removed things", ready: true, icon: { glyph: "expunged", shortcut: true } },
  { id: "recycle", label: "Recycle Bin", detail: "Deleted drafts and records", ready: true, icon: { glyph: "recycle" } },
] as const satisfies readonly DesktopEntry[];

export type DesktopFolder = (typeof desktopFolders)[number];

/** Locations reachable only from inside My PC. */
export const myPcContents = [
  { id: "system", label: "System", detail: "Workstation files and help", ready: true, icon: { glyph: "system" } },
] as const satisfies readonly DesktopEntry[];

export type MyPcItem = (typeof myPcContents)[number];

export type DesktopDestination = DesktopFolder | MyPcItem;

/** The Start menu already shows each label inline, so only the desktop rail explains destinations on hover. */
function desktopHint(folder: DesktopFolder) {
  if (!folder.detail) return "Workstation contents";
  // Only a destination that opens a real screen opts in, so the promise stays truthful.
  return "ready" in folder && folder.ready ? folder.detail : `${folder.detail} (coming soon)`;
}

export function DesktopNavigation({ onOpen, activeId, compact = false }: {
  onOpen: (entry: DesktopDestination, trigger: HTMLButtonElement) => void;
  activeId?: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label={compact ? "Start applications" : "Desktop folders"} className={compact ? "start-navigation" : "desktop-navigation"}>
      {desktopFolders.map((folder) => {
        const shortcut = (
          <button type="button" className="desktop-shortcut" aria-label={folder.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, event.currentTarget)}>
            <DesktopIcon icon={folder.icon} />
            <span>{folder.label}</span>
          </button>
        );
        return compact ? (
          <button key={folder.id} type="button" className="desktop-shortcut" aria-label={folder.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, event.currentTarget)}>
            <DesktopIcon icon={folder.icon} />
            <span>{folder.label}</span>
          </button>
        ) : (
          <Tooltip key={folder.id}>
            <TooltipTrigger asChild>{shortcut}</TooltipTrigger>
            <TooltipContent className="circa-label" side="right" align="center">{desktopHint(folder)}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
