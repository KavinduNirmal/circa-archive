"use client";

import { DesktopIcon, type DesktopIconSpec } from "./desktop-icons";

export type DesktopEntry = {
  /** Stable identifier used for CSS hooks, keys, and test selectors. */
  id: string;
  /** Uppercase-free display name; CSS applies the workstation casing. */
  label: string;
  /** Tooltip and placeholder copy for destinations without content yet. */
  detail: string | null;
  icon: DesktopIconSpec;
};

/**
 * Desktop shortcuts in reading order: workstation containers first, then the
 * editor, then the archive tools and disposal. My PC is the workstation
 * container; its contents (see `myPcContents`) nest System one level deep
 * instead of exposing every workstation location on the desktop.
 */
export const desktopFolders = [
  { id: "my-pc", label: "My PC", detail: null, icon: { glyph: "my-pc" } },
  { id: "records", label: "My Documents", detail: "Your drafts and filed records", icon: { glyph: "records" } },
  { id: "archive", label: "Archive", detail: "Incident files and filed records", icon: { glyph: "archive", shortcut: true } },
  { id: "organizations", label: "Organizations", detail: "Organization dossiers and continuities", icon: { glyph: "organizations" } },
  { id: "inbox", label: "Inbox", detail: "Correspondence and dead letters", icon: { glyph: "inbox" } },
  { id: "write", label: "CIRCA Word", detail: "Document editor", icon: { glyph: "circa-word" } },
  { id: "search", label: "Search", detail: "Find records, incidents, and organizations", icon: { glyph: "search" } },
  { id: "expunged", label: "_EXPUNGED", detail: "The archive of removed things", icon: { glyph: "expunged", shortcut: true } },
  { id: "recycle", label: "Recycle Bin", detail: "Deleted drafts and records", icon: { glyph: "recycle" } },
] as const satisfies readonly DesktopEntry[];

export type DesktopFolder = (typeof desktopFolders)[number];

/** Locations reachable only from inside My PC. */
export const myPcContents = [
  { id: "system", label: "System", detail: "Workstation files and help", icon: { glyph: "system" } },
] as const satisfies readonly DesktopEntry[];

export type MyPcItem = (typeof myPcContents)[number];

export type DesktopDestination = DesktopFolder | MyPcItem;

export function DesktopNavigation({ onOpen, activeId, compact = false }: {
  onOpen: (entry: DesktopFolder, trigger: HTMLButtonElement) => void;
  activeId?: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label={compact ? "Start applications" : "Desktop folders"} className={compact ? "start-navigation" : "desktop-navigation"}>
      {desktopFolders.map((folder) => (
        <button key={folder.id} type="button" className="desktop-shortcut" aria-label={folder.label}
          aria-pressed={activeId === folder.id}
          title={folder.detail ? `${folder.detail} (coming soon)` : "Workstation contents"}
          onClick={(event) => onOpen(folder, event.currentTarget)}>
          <DesktopIcon icon={folder.icon} />
          <span>{folder.label}</span>
        </button>
      ))}
    </nav>
  );
}
