"use client";

import { useTranslations } from "next-intl";
import {
  desktopCopy,
  desktopFolders,
  desktopHint,
  type DesktopCopy,
  type DesktopDestination,
} from "@/lib/desktop-destinations";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DesktopIcon } from "./desktop-icons";

/**
 * The desktop rail and the Start menu's application list.
 *
 * The destinations and their copy lookups live in
 * `src/lib/desktop-destinations.ts`, because the server routes derive their
 * static params from the same list and a `"use client"` module cannot be
 * imported by a server page. This file is only the control that renders them.
 */
export function DesktopNavigation({
  onOpen,
  activeId,
  compact = false,
}: {
  onOpen: (
    entry: DesktopDestination,
    copy: DesktopCopy,
    trigger: HTMLButtonElement,
  ) => void;
  activeId?: string;
  compact?: boolean;
}) {
  const t = useTranslations("shell");

  return (
    <nav
      aria-label={t(compact ? "startApplicationsLabel" : "foldersLabel")}
      className={compact ? "start-navigation" : "desktop-navigation"}
    >
      {desktopFolders.map((folder) => {
        const copy = desktopCopy(t, folder);
        const shortcut = (
          <button
            type="button"
            className="desktop-shortcut"
            aria-label={copy.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, copy, event.currentTarget)}
          >
            <DesktopIcon icon={folder.icon} />
            <span>{copy.label}</span>
          </button>
        );
        return compact ? (
          <button
            key={folder.id}
            type="button"
            className="desktop-shortcut"
            aria-label={copy.label}
            aria-pressed={activeId === folder.id}
            onClick={(event) => onOpen(folder, copy, event.currentTarget)}
          >
            <DesktopIcon icon={folder.icon} />
            <span>{copy.label}</span>
          </button>
        ) : (
          <Tooltip key={folder.id}>
            <TooltipTrigger asChild>{shortcut}</TooltipTrigger>
            <TooltipContent className="circa-label" side="right" align="center">
              {desktopHint(t, folder)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
