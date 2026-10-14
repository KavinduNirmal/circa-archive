"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, Popover } from "radix-ui";
import { DesktopIcon, notificationGlyph, settingsGlyph } from "./desktop-icons";
import { desktopFolders, DesktopNavigation, myPcContents, type DesktopDestination, type DesktopFolder, type MyPcItem } from "./desktop-navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const NotificationIcon = notificationGlyph;
const SettingsIcon = settingsGlyph;

/**
 * Which surface the workstation dialog is showing. `folder` is a desktop
 * destination; `system` is a nested My PC location with a back-track, matching
 * the shell's breadcrumb model for constrained terminals.
 */
type WorkstationView =
  | { kind: "desktop" }
  | { kind: "folder"; entry: DesktopDestination }
  | { kind: "system"; parent: DesktopFolder };

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

function TaskbarTray({ screenFilter, onToggleScreenFilter }: { screenFilter: boolean; onToggleScreenFilter: (next: boolean) => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      {/* Settings reads as an open task item, matching the reference taskbar's wide window buttons.
          The anchor carries the bevel so the tooltip trigger can wrap the button without
          disturbing the taskbar's flex rhythm. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="taskbar-task-anchor">
            <button className="taskbar-task" type="button" aria-label="Settings"
              data-open={settingsOpen ? "true" : undefined} onClick={() => setSettingsOpen(true)}>
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
      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
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
    </>
  );
}

export function DesktopShell() {
  const [view, setView] = useState<WorkstationView>({ kind: "desktop" });
  const [startOpen, setStartOpen] = useState(false);
  const [screenFilter, setScreenFilter] = useState(true);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const startTrigger = useRef<HTMLButtonElement | null>(null);

  function openFolder(folder: DesktopFolder, trigger: HTMLButtonElement) {
    lastTrigger.current = startOpen ? startTrigger.current : trigger;
    setStartOpen(false);
    setView({ kind: "folder", entry: folder });
  }

  function openMyPcItem(entry: MyPcItem) {
    if (entry.id === "system") setView({ kind: "system", parent: desktopFolders[0] });
  }

  function closeView() {
    setView({ kind: "desktop" });
  }

  const activeId = view.kind === "folder" ? view.entry.id : undefined;
  const dialogTitle = view.kind === "system" ? "System" : view.kind === "folder" ? view.entry.label : "";
  const dialogIcon = view.kind === "system" ? myPcContents[0].icon : view.kind === "folder" ? view.entry.icon : null;

  return (
    <main className="desktop-shell" aria-label="CIRCA desktop">
      <TooltipProvider>
        <div className="desktop-wallpaper" aria-hidden="true" />
        <header className="desktop-topline">
          <span><strong>CIRCA/OS</strong><span className="topline-separator">/</span> ARCHIVE WORKSTATION</span>
          <span className="desktop-session">LOCAL PREVIEW</span>
        </header>
        <DesktopNavigation onOpen={openFolder} activeId={activeId} />
        <footer className="desktop-taskbar" aria-label="Taskbar">
          <Popover.Root open={startOpen} onOpenChange={setStartOpen}>
            <Popover.Trigger ref={startTrigger} className="taskbar-start circa-raised" aria-label="Start">
              <span className="start-symbol" aria-hidden="true">▦</span> START
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="start-panel circa-raised" side="top" align="start" sideOffset={8}
                onCloseAutoFocus={(event) => { if (view.kind !== "desktop") event.preventDefault(); }}>
                <div className="start-heading">CIRCA/OS <span>APPLICATIONS</span></div>
                <DesktopNavigation compact onOpen={openFolder} activeId={activeId} />
                <p className="start-note">Application contents coming soon.</p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div className="taskbar-divider" />
          <TaskbarTray screenFilter={screenFilter} onToggleScreenFilter={setScreenFilter} />
        </footer>
        <Dialog.Root open={view.kind !== "desktop"} onOpenChange={(open) => { if (!open) closeView(); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="folder-backdrop" />
            <Dialog.Content className="folder-window circa-raised" onCloseAutoFocus={(event) => {
              event.preventDefault();
              lastTrigger.current?.focus();
            }}>
              <div className="folder-titlebar">
                <Dialog.Title>{dialogTitle}</Dialog.Title>
                <Dialog.Close className="folder-close circa-raised" aria-label="Close folder">×</Dialog.Close>
              </div>
              <div className="folder-address">
                {view.kind === "system" ? <>DESKTOP / MY PC / SYSTEM</> : <>DESKTOP / {dialogTitle}</>}
              </div>
              <Dialog.Description className="folder-note">This folder is not connected yet.</Dialog.Description>
              {view.kind === "system" ? (
                <div className="folder-empty">
                  <h2>Workstation configuration</h2>
                  <p>System files and help move here from the desktop list.</p>
                  <button type="button" className="return-button circa-raised" onClick={() => setView({ kind: "folder", entry: view.parent })}>
                    Back to My PC
                  </button>
                </div>
              ) : (
                <div className="folder-body">
                  {view.kind === "folder" && view.entry.id === "my-pc" ? (
                    <div className="pc-contents" aria-label="My PC contents">
                      {myPcContents.map((entry) => (
                        <Tooltip key={entry.id}>
                          <TooltipTrigger asChild>
                            <button type="button" className="pc-item" aria-label={entry.label} onClick={() => openMyPcItem(entry)}>
                              <DesktopIcon icon={entry.icon} className="pc-item-icon" />
                              <span>{entry.label}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="circa-label" side="top">{entry.detail}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <div className="folder-empty">
                      {dialogIcon && <DesktopIcon icon={dialogIcon} className="folder-destination-icon" />}
                      <h2>Coming soon</h2>
                      {/* TODO: Connect each destination when its application screen is implemented. */}
                      {view.kind === "folder" && view.entry.detail && <p>{view.entry.detail} will appear here.</p>}
                    </div>
                  )}
                  <Dialog.Close className="return-button circa-raised">Return to desktop</Dialog.Close>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        {screenFilter && <div className="desktop-screen-filter" aria-hidden="true" data-testid="screen-filter" />}
      </TooltipProvider>
    </main>
  );
}
