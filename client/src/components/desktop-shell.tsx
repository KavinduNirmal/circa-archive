"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, Popover } from "radix-ui";
import { TaskbarWindows, WindowLayer, useWorkstationWindows } from "./window-manager";
import { DesktopIcon, notificationGlyph, settingsGlyph, type DesktopIconSpec } from "./desktop-icons";
import { desktopFolders, DesktopNavigation, myPcContents, type DesktopFolder } from "./desktop-navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const NotificationIcon = notificationGlyph;
const SettingsIcon = settingsGlyph;

/** A destination opened as a window, plus the copy its own status strip shows. */
type DestinationWindow = { id: string; title: string; status: string; icon: DesktopIconSpec; detail: string | null };

/**
 * Fixed workstation status shown in the header strip.
 *
 * Every network value is fiction. The shell has no backend, so the link state,
 * address, latency, and the archive-wide terminal count are decorative copy
 * that dresses the interface as a CIRCA terminal. The `simulated` flag renders
 * the SIMULATED tag in the strip so nobody reads them as live telemetry; set it
 * to false and replace the values when the backend exists.
 */
const WORKSTATION_STATUS = {
  uplink: { state: "SIMULATED LINK", signal: "simulated" },
  address: "10.42.0.19",
  latency: "24ms",
  terminals: "7 terminals signed in",
  sync: "SYNCED 06:12",
  simulated: true,
} as const;

function WorkstationClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time dateTime={now?.toISOString()} className="workstation-clock">
    {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "--:--"}
    <span> UTC</span>
  </time>;
}

function WorkstationStatus() {
  const { uplink, address, latency, terminals, sync, simulated } = WORKSTATION_STATUS;
  return (
    <div className="workstation-status">
      <span className={`status-chip status-${uplink.signal}`}>{uplink.state}</span>
      <span className="status-item">{address}</span>
      <span className="status-separator" aria-hidden="true">/</span>
      <span className="status-item">{latency}</span>
      <span className="status-separator" aria-hidden="true">/</span>
      <span className="status-item">{terminals}</span>
      <span className="status-separator" aria-hidden="true">/</span>
      <span className="status-item">{sync}</span>
      {simulated && <span className="status-sim" title="Placeholder values shown while the archive backend is unavailable">SIMULATED</span>}
    </div>
  );
}

function TaskbarTray({ settingsOpen, onOpenSettings }: { settingsOpen: boolean; onOpenSettings: () => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <>
      {/* Settings reads as an open task item, matching the reference taskbar's wide window buttons.
          The anchor carries the bevel so the tooltip trigger can wrap the button without
          disturbing the taskbar's flex rhythm. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="taskbar-task-anchor">
            <button className="taskbar-task" type="button" aria-label="Settings"
              data-open={settingsOpen ? "true" : undefined} onClick={onOpenSettings}>
              <SettingsIcon className="tray-glyph" />
              <span>Settings</span>
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="circa-label" side="top">Workstation preferences</TooltipContent>
      </Tooltip>
      <div className="taskbar-spacer" />
      <div className="taskbar-tray">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="tray-anchor">
              <Popover.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <Popover.Trigger className="tray-button" aria-label="Notifications">
                  <NotificationIcon className="tray-glyph" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content className="tray-panel circa-raised" side="top" align="end" sideOffset={8}>
                    <div className="tray-heading">NOTIFICATIONS</div>
                    {/* TODO: Replace with real notification delivery when the backend exists. */}
                    <p className="tray-note">Notifications are not connected yet.</p>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </span>
          </TooltipTrigger>
          <TooltipContent className="circa-label" side="top">Notifications</TooltipContent>
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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="settings-backdrop" />
        <Dialog.Content className="settings-window circa-raised">
          <div className="settings-titlebar">
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Close className="settings-close circa-raised" aria-label="Close settings">×</Dialog.Close>
          </div>
          <Dialog.Description className="settings-intro">Workstation preferences. Only screen surface options respond in this preview.</Dialog.Description>
          <label className="settings-option">
            <input type="checkbox" className="settings-checkbox" checked={screenFilter}
              onChange={(event) => onToggleScreenFilter(event.target.checked)} />
            <span>CRT screen filter</span>
          </label>
          <p className="settings-note">Wallpaper, sound, and session preferences are not connected yet.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DesktopShell() {
  const [startOpen, setStartOpen] = useState(false);
  const [screenFilter, setScreenFilter] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    if (!lastFocused) return;
    areaRef.current?.focus({ preventScroll: true });
  }, [lastFocused]);

  /** Opens a desktop shortcut as a window, naming the entry for the titlebar and status strip. */
  function openFolder(folder: DesktopFolder, trigger?: HTMLButtonElement) {
    openWindow({
      id: folder.id,
      title: folder.label,
      status: folder.id === "my-pc" ? "WORKSTATION" : folder.detail ?? "LOCATION",
      icon: folder.icon,
      detail: folder.detail,
    }, trigger);
  }

  function openWindow(entry: DestinationWindow, trigger?: HTMLButtonElement) {
    if (trigger) launchTriggers.current[entry.id] = trigger;
    setStartOpen(false);
    open(
      { id: entry.id, title: entry.title, status: entry.status, icon: entry.icon },
      // The layer may not have been measured yet on the first click; fall back to the viewport.
      area.width && area.height ? area : { width: window.innerWidth, height: Math.max(240, window.innerHeight - 80) },
    );
  }

  function closeWindow(id: string) {
    const trigger = launchTriggers.current[id];
    delete launchTriggers.current[id];
    close(id);
    window.setTimeout(() => trigger?.focus(), 0);
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
      if (event.key !== "Escape" || !topWindow) return;
      closeWindow(topWindow.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function windowContent(id: string) {
    if (id === "system") {
      return (
        <div className="window-pane">
          <h2>Workstation configuration</h2>
          <div className="window-help">
            <DesktopIcon icon={{ glyph: "help" }} className="window-help-icon" />
            <p>System files and help are filed inside My PC.</p>
          </div>
          <button type="button" className="return-button circa-raised" onClick={() => openWindow({
            id: myPcFolder.id, title: myPcFolder.label, status: "WORKSTATION", icon: myPcFolder.icon, detail: myPcFolder.detail,
          })}>
            Back to My PC
          </button>
        </div>
      );
    }
    const folder = desktopFolders.find((item) => item.id === id);
    if (folder?.id === "my-pc") {
      return (
        <div className="pc-contents" aria-label="My PC contents">
          {myPcContents.map((entry) => (
            <Tooltip key={entry.id}>
              <TooltipTrigger asChild>
                <button type="button" className="pc-item" aria-label={entry.label} onClick={() => openWindow({
                  id: entry.id, title: entry.label, status: entry.detail ?? "LOCATION", icon: entry.icon, detail: entry.detail,
                })}>
                  <DesktopIcon icon={entry.icon} className="pc-item-icon" />
                  <span>{entry.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="circa-label" side="top">{entry.detail}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      );
    }
    const detail = windows.find((item) => item.id === id)?.status ?? null;
    return (
      <div className="window-pane window-pane-empty">
        <h2>Coming soon</h2>
        {/* TODO: Connect each destination when its application screen is implemented. */}
        <p className="window-note">This folder is not connected yet.</p>
        {detail && detail !== "LOCATION" && <p>{detail} will appear here.</p>}
        <p className="window-hint">Drag the titlebar to move this window. Use the corner to resize it.</p>
      </div>
    );
  }

  const myPcFolder = desktopFolders[0];

  return (
    <main className="desktop-shell" aria-label="CIRCA desktop" ref={shellRef}>
      <TooltipProvider>
        <div className="desktop-wallpaper" aria-hidden="true" />
        <header className="desktop-topline" aria-label="Workstation status">
          <span className="topline-station">
            CIRCA/OS <span className="topline-separator" aria-hidden="true">/</span> ARCHIVE WORKSTATION
            <span className="topline-separator" aria-hidden="true">/</span>
            <span className="topline-console">CONSOLE 04</span>
          </span>
          <WorkstationStatus />
        </header>
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
        <footer className="desktop-taskbar" aria-label="Taskbar">
          <Popover.Root open={startOpen} onOpenChange={setStartOpen}>
            <Popover.Trigger ref={startTrigger} className="taskbar-start circa-raised" aria-label="Start">
              <span className="start-symbol" aria-hidden="true">▦</span> START
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="start-panel circa-raised" side="top" align="start" sideOffset={8}
                onCloseAutoFocus={(event) => { if (windows.length > 0) event.preventDefault(); }}>
                <div className="start-heading">CIRCA/OS <span>APPLICATIONS</span></div>
                <DesktopNavigation compact onOpen={openFolder} activeId={lastFocused ?? undefined} />
                <p className="start-note">Application contents coming soon.</p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div className="taskbar-divider" />
          <TaskbarWindows windows={windows} onSelect={focusWindow} />
          <div className="taskbar-spacer" />
          <TaskbarTray settingsOpen={settingsOpen} onOpenSettings={() => setSettingsOpen(true)} />
        </footer>
        {screenFilter && <div className="desktop-screen-filter" aria-hidden="true" data-testid="screen-filter" />}
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} screenFilter={screenFilter} onToggleScreenFilter={setScreenFilter} />
      </TooltipProvider>
    </main>
  );
}
