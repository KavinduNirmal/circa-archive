"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, Popover } from "radix-ui";
import { Link } from "@/i18n/navigation";
import { ArchiveBrowser } from "./browser/browser-window";
import { FileExplorer } from "./files/file-explorer";
import { WordWindow } from "./word/word-window";
import { MailWindow } from "./mail/mail-window";
import { LanguageSwitcher } from "./language-switcher";
import { useReaderSession } from "./reader/reader-session";
import { RecordReader, type RecordTrail } from "./reader/reader-window";
import { RecordFilingBody } from "./reader/record-filings";
import { TaskbarWindows, WindowLayer, useWorkstationWindows } from "./window-manager";
import { DesktopIcon, notificationGlyph, settingsGlyph, type DesktopIconSpec } from "./desktop-icons";
import { DesktopNavigation } from "./desktop-navigation";
import {
  EXPLORER_SCOPES,
  destinationById,
  explorerTitle,
  type DesktopCopy,
  type DesktopDestination,
} from "@/lib/desktop-destinations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import "./workstation.css";

const NotificationIcon = notificationGlyph;
const SettingsIcon = settingsGlyph;

/** A destination opened as a window, plus the copy its own status strip shows. */
type DestinationWindow = { id: string; title: string; status: string | null; icon: DesktopIconSpec; detail: string | null };

function WorkstationClock() {
  const t = useTranslations("shell");
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  /*
   * The clock keeps the workstation's own format rather than the reader's: this
   * is a machine readout in UTC, and a locale-dependent am/pm would change its
   * width as the language changed.
   */
  return <time dateTime={now?.toISOString()} className="workstation-clock">
    {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "--:--"}
    <span> {t("clockUtc")}</span>
  </time>;
}

/** Pinned task item. The reference keeps window buttons directly beside Start, so this sits left-aligned. */
function SettingsTaskItem({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const t = useTranslations("shell");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="taskbar-task-anchor">
          <button className="taskbar-task" type="button" aria-label={t("settingsTaskLabel")}
            data-open={open ? "true" : undefined} onClick={onOpen}>
            <SettingsIcon className="tray-glyph" />
            <span>{t("settingsTaskLabel")}</span>
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="circa-label" side="top">{t("settingsTaskHint")}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Right-hand tray, beside the clock.
 *
 * The language switcher lives here because it is a machine-level preference the
 * reader may need without opening Settings, and because the tray is where the
 * workstation already keeps its standing controls.
 */
function TaskbarTray() {
  const t = useTranslations("shell");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <>
      <div className="taskbar-tray">
        <LanguageSwitcher className="tray-language" />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="tray-anchor">
              <Popover.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <Popover.Trigger className="tray-button" aria-label={t("notificationsLabel")}>
                  <NotificationIcon className="tray-glyph" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content className="tray-panel circa-raised" side="top" align="end" sideOffset={8}>
                    <div className="tray-heading">{t("notificationsHeading")}</div>
                    {/* TODO: Replace with real notification delivery when the backend exists. */}
                    <p className="tray-note">{t("notificationsEmpty")}</p>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </span>
          </TooltipTrigger>
          <TooltipContent className="circa-label" side="top">{t("notificationsLabel")}</TooltipContent>
        </Tooltip>
      </div>
      <WorkstationClock />
    </>
  );
}

/** Full-screen Settings stays a modal: it is workstation chrome, not a document window. */
function SettingsDialog({ open, onOpenChange, screenFilter, onToggleScreenFilter }: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  screenFilter: boolean;
  onToggleScreenFilter: (next: boolean) => void;
}) {
  const t = useTranslations("shell");
  const tSwitcher = useTranslations("switcher");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="settings-backdrop" />
        <Dialog.Content className="settings-window circa-raised">
          <div className="settings-titlebar">
            <Dialog.Title>{t("settingsTitle")}</Dialog.Title>
            <Dialog.Close className="settings-close circa-raised" aria-label={t("settingsClose")}>×</Dialog.Close>
          </div>
          <Dialog.Description className="settings-intro">{t("settingsIntro")}</Dialog.Description>
          <label className="settings-option">
            <input type="checkbox" className="settings-checkbox" checked={screenFilter}
              onChange={(event) => onToggleScreenFilter(event.target.checked)} />
            <span>{t("settingsScreenFilter")}</span>
          </label>
          <p className="settings-note">{t("settingsNote")}</p>
          <div className="settings-language-row">
            <span>{tSwitcher("label")}</span>
            <LanguageSwitcher className="settings-language" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DesktopShell() {
  const t = useTranslations("shell");
  const [startOpen, setStartOpen] = useState(false);
  const [screenFilter, setScreenFilter] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The records open in the reader, and where in that stack it is standing. The
  // shell owns this because the shell is what opens a record: a code clicked in
  // the archive and a code clicked in a follow-up strip are the same event.
  const [readerTrail, setReaderTrail] = useState<RecordTrail>({ codes: [], at: 0 });
  const readerSession = useReaderSession();
  const { windows, lastFocused, open, close, focus, minimize, toggleMaximize, setGeometry } = useWorkstationWindows();
  const shellRef = useRef<HTMLElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const startTrigger = useRef<HTMLButtonElement | null>(null);
  const launchTriggers = useRef<Record<string, HTMLButtonElement>>({});
  const [area, setArea] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Windows live in a layer that already excludes the status strip and taskbar,
  // so drag bounds and maximize only need the layer's own measurement.
  useEffect(() => {
    const layer = areaRef.current;
    if (!layer) return;
    const measure = () => setArea({ width: layer.clientWidth, height: layer.clientHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    // Focusing the layer would also steal focus from the window's own controls.
    if (lastFocused) areaRef.current?.focus({ preventScroll: true });
  }, [lastFocused]);

  /** Opens a desktop shortcut as a window, naming the entry for the titlebar and status strip. */
  function openFolder(folder: DesktopDestination, copy: DesktopCopy, trigger?: HTMLButtonElement) {
    // An application that names its own window and prints its own status bar
    // drops the frame's generic strip rather than stacking a second one on it.
    const applicationTitles: Partial<Record<string, string>> = {
      search: t("browserTitle"),
      inbox: t("mailTitle"),
      write: t("wordTitle"),
    };
    const entry = destinationById(folder.id);
    const title = applicationTitles[folder.id] ?? (entry ? explorerTitle(t, entry) : undefined);
    openWindow({
      id: folder.id,
      title: title ?? copy.label,
      status: title ? null : copy.detail || t("locationStatus"),
      icon: folder.icon,
      detail: copy.detail,
    }, trigger);
  }

  function openWindow(entry: DestinationWindow, trigger?: HTMLButtonElement, maximized = false) {
    if (trigger) launchTriggers.current[entry.id] = trigger;
    setStartOpen(false);
    open(
      { id: entry.id, title: entry.title, status: entry.status, icon: entry.icon },
      // The layer may not have been measured yet on the first click; fall back to the viewport.
      area.width && area.height ? area : { width: window.innerWidth, height: Math.max(240, window.innerHeight - 80) },
      maximized,
    );
  }

  /**
   * Opens a record in the reader, which is the only screen that reads one.
   *
   * The viewer always comes up maximized: a record is the thing you are doing,
   * not a window beside the thing you are doing. The taskbar stays, so the
   * desktop is still underneath and the frame still minimizes and closes.
   */
  function openRecord(code: string) {
    setReaderTrail((current) => {
      if (current.codes[current.at] === code) return current;
      const codes = [...current.codes.slice(0, current.at + 1), code];
      return { codes, at: codes.length - 1 };
    });
    openWindow({ id: "reader", title: t("readerTitle"), status: null, icon: { glyph: "reader" }, detail: null }, undefined, true);
  }

  /** Reads along the trail the viewer already has. */
  function travelRecord(delta: 1 | -1) {
    setReaderTrail((current) => {
      const at = current.at + delta;
      return at < 0 || at >= current.codes.length ? current : { ...current, at };
    });
  }

  function closeWindow(id: string) {
    const trigger = launchTriggers.current[id];
    delete launchTriggers.current[id];
    close(id);
    // Return focus only when the desktop is what remains, so a surviving window keeps focus.
    window.setTimeout(() => {
      if (windows.filter((item) => item.id !== id).length === 0) trigger?.focus();
    }, 0);
  }

  function focusWindow(id: string) {
    const target = windows.find((item) => item.id === id);
    if (target?.minimized || lastFocused !== id) {
      if (target?.minimized && target.maximized) setGeometry(id, target.geometry);
      focus(id);
    }
  }

  const activeWindow = lastFocused ? windows.find((item) => item.id === lastFocused && !item.minimized) : undefined;
  const topWindow = windows.filter((item) => !item.minimized).sort((a, b) => b.z - a.z)[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // A menu, popover, or alert that already handled Escape closed itself; closing
      // the focused window on the same press would dismiss two layers at once.
      if (event.key !== "Escape" || event.defaultPrevented || !topWindow) return;
      closeWindow(topWindow.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function windowContent(id: string) {
    // Search is the archive browser: one permanent tab onto the internal index.
    if (id === "search") {
      return <ArchiveBrowser onCloseWindow={() => closeWindow(id)} onOpenRecord={openRecord} />;
    }
    // The reader is opened by a record rather than by a shortcut, and reads it.
    if (id === "reader") {
      return (
        <RecordReader
          trail={readerTrail}
          session={readerSession}
          onOpenRecord={openRecord}
          onTravel={travelRecord}
          onCloseWindow={() => closeWindow(id)}
          renderSection={(section) => <RecordFilingBody section={section} />}
        />
      );
    }
    // Inbox is the mail client over the terminal's own correspondence store.
    if (id === "inbox") {
      return <MailWindow onCloseWindow={() => closeWindow(id)} />;
    }
    // CIRCA Word is the record editor: a Markdown format bar over one draft.
    if (id === "write") {
      return <WordWindow onCloseWindow={() => closeWindow(id)} />;
    }
    // Every folder destination is the file browser, rooted at that destination.
    if (EXPLORER_SCOPES.has(id)) {
      return <FileExplorer scopeId={id} onCloseWindow={() => closeWindow(id)} />;
    }
    const detail = windows.find((item) => item.id === id)?.status ?? null;
    return (
      <div className="window-pane window-pane-empty">
        <h2>{t("emptyTitle")}</h2>
        {/* TODO: Connect each destination when its application screen is implemented. */}
        <p className="window-note">{t("emptyNote")}</p>
        {detail && detail !== t("locationStatus") && <p>{t("emptyDetail", { detail })}</p>}
        <p className="window-hint">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <main className="desktop-shell" aria-label={t("desktopLabel")} ref={shellRef}>
      <TooltipProvider>
        <div className="desktop-wallpaper" aria-hidden="true" />
        <div className="desktop-area" ref={areaRef} tabIndex={-1}>
          <DesktopNavigation onOpen={openFolder} activeId={lastFocused ?? undefined} />
          <WindowLayer
            windows={windows}
            area={area}
            activeId={activeWindow?.id ?? null}
            childrenFor={(item) => windowContent(item.id)}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimize}
            onMaximize={toggleMaximize}
            onGeometryChange={setGeometry}
          />
        </div>
        <footer className="desktop-taskbar" aria-label={t("taskbarLabel")}>
          <Popover.Root open={startOpen} onOpenChange={setStartOpen}>
            <Popover.Trigger ref={startTrigger} className="taskbar-start circa-raised" aria-label={t("startLabel")}>
              <span className="start-symbol" aria-hidden="true">▦</span> {t("start")}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="start-panel circa-raised" side="top" align="start" sideOffset={8}
                onCloseAutoFocus={(event) => { if (windows.length > 0) event.preventDefault(); }}>
                <div className="start-heading">{t("startHeading")} <span>{t("startHeadingNote")}</span></div>
                <DesktopNavigation compact onOpen={openFolder} activeId={lastFocused ?? undefined} />
                <p className="start-note">{t("startNote")}</p>
                {/*
                  The one way out of the fiction. The workstation is reached from
                  the public landing page, so leaving it has to be a real control
                  rather than a browser back button nobody is told about.
                */}
                <Link className="start-public" href="/">
                  <DesktopIcon icon={{ glyph: "public" }} />
                  <span className="start-public-copy">
                    <span className="start-public-title">{t("publicSiteTitle")}</span>
                    <span className="start-public-note">{t("publicSiteNote")}</span>
                  </span>
                </Link>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div className="taskbar-divider" />
          {/* Window buttons grow from the left, directly beside the pinned task item. */}
          <TaskbarWindows windows={windows} activeId={activeWindow?.id ?? null} onSelect={focusWindow} />
          <SettingsTaskItem open={settingsOpen} onOpen={() => setSettingsOpen(true)} />
          <div className="taskbar-spacer" />
          <TaskbarTray />
        </footer>
        {screenFilter && <div className="desktop-screen-filter" aria-hidden="true" data-testid="screen-filter" />}
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} screenFilter={screenFilter} onToggleScreenFilter={setScreenFilter} />
      </TooltipProvider>
    </main>
  );
}
