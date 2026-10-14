"use client";

import { useCallback, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { DesktopIcon, type DesktopIconSpec } from "./desktop-icons";

/** Pixel geometry of a workstation window, in desktop-layer coordinates. */
export type WindowGeometry = { x: number; y: number; width: number; height: number };

/** Bounds of the desktop area, excluding the status strip and the taskbar. */
export type DesktopArea = { width: number; height: number };

export type WorkstationWindowState = {
  /** Stable key: the destination id, so reopening focuses instead of duplicating. */
  id: string;
  title: string;
  /** Uppercase status shown in the window's own status strip. */
  status: string;
  icon: DesktopIconSpec;
  /** Geometry used when not maximized. */
  geometry: WindowGeometry;
  maximized: boolean;
  minimized: boolean;
  /** Monotonic counter that decides paint order. */
  z: number;
};

const WINDOW_MIN_SIZE = { width: 260, height: 180 };
/** Cascading offsets so a new window never lands exactly under the previous one. */
const CASCADE_STEP = 26;
const CASCADE_WRAP = 6;

/**
 * Central window registry for the shell: creation, focus, stacking,
 * minimization, and maximize/restore. Geometry stays here rather than in the
 * window component so a maximized window can restore its previous frame, and
 * so the taskbar sees one source of truth.
 */
export function useWorkstationWindows() {
  const [windows, setWindows] = useState<WorkstationWindowState[]>([]);
  const [lastFocused, setLastFocused] = useState<string | null>(null);

  const focus = useCallback((id: string) => {
    setLastFocused(id);
    setWindows((current) => {
      const top = current.reduce((max, item) => Math.max(max, item.z), 0);
      const target = current.find((item) => item.id === id);
      if (!target || (target.z === top && !target.minimized)) return current;
      return current.map((item) => item.id === id ? { ...item, z: top + 1, minimized: false } : item);
    });
  }, []);

  const open = useCallback((entry: { id: string; title: string; status: string; icon: DesktopIconSpec }, area: DesktopArea) => {
    setLastFocused(entry.id);
    setWindows((current) => {
      const existing = current.find((item) => item.id === entry.id);
      const top = current.reduce((max, item) => Math.max(max, item.z), 0);
      if (existing) return current.map((item) => item.id === entry.id ? { ...item, z: top + 1, minimized: false } : item);
      const step = (current.length % CASCADE_WRAP) * CASCADE_STEP;
      return [...current, {
        id: entry.id,
        title: entry.title,
        status: entry.status,
        icon: entry.icon,
        geometry: {
          x: 90 + step,
          y: 70 + step,
          width: Math.max(WINDOW_MIN_SIZE.width, Math.min(520, area.width - 180 - step)),
          height: Math.max(WINDOW_MIN_SIZE.height, Math.min(400, area.height - 140 - step)),
        },
        maximized: false,
        minimized: false,
        z: top + 1,
      }];
    });
  }, []);

  const close = useCallback((id: string) => {
    setWindows((current) => current.filter((item) => item.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, minimized: true } : item));
    setLastFocused((current) => current === id ? null : current);
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, maximized: !item.maximized, minimized: false } : item));
  }, []);

  const setGeometry = useCallback((id: string, geometry: WindowGeometry) => {
    setWindows((current) => current.map((item) => item.id === id
      ? { ...item, geometry: { ...geometry, width: Math.max(WINDOW_MIN_SIZE.width, geometry.width), height: Math.max(WINDOW_MIN_SIZE.height, geometry.height) } }
      : item));
  }, []);

  return { windows, lastFocused, open, close, focus, minimize, toggleMaximize, setGeometry };
}

/**
 * One draggable, resizable workstation window.
 *
 * Positioning is written as explicit `left`/`top` from the registry. react-rnd
 * owns only the resize handles: driving its drag path as well double-applied the
 * offset (react-draggable adds its own transform on top of the position it is
 * handed), so the shell moves the frame and react-rnd resizes it. Maximize also
 * stays on registry geometry, which is what makes restore exact.
 */
export function WorkstationWindow({ window: item, area, active, children, onFocus, onClose, onMinimize, onMaximize, onGeometryChange }: {
  window: WorkstationWindowState;
  area: DesktopArea;
  active: boolean;
  children: React.ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onGeometryChange: (geometry: WindowGeometry) => void;
}) {
  const maximized = item.maximized;
  const geometry = maximized ? { x: 0, y: 0, width: area.width, height: area.height } : item.geometry;
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resize = useRef<{ startX: number; startY: number; width: number; height: number } | null>(null);

  /**
   * Pointer-based titlebar dragging. The frame is clamped to the desktop layer
   * here, so a dragged window can never be parked under the status strip or the
   * taskbar and its controls stay reachable at any viewport.
   */
  function beginDrag(event: React.PointerEvent<HTMLElement>) {
    onFocus();
    if (maximized || (event.target as HTMLElement).closest("button")) return;
    (event.currentTarget.parentElement?.parentElement as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, originX: geometry.x, originY: geometry.y };
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state) return;
    const maxX = Math.max(0, area.width - geometry.width);
    const maxY = Math.max(0, area.height - geometry.height);
    onGeometryChange({
      ...geometry,
      x: Math.min(maxX, Math.max(0, state.originX + (event.clientX - state.startX))),
      y: Math.min(maxY, Math.max(0, state.originY + (event.clientY - state.startY))),
    });
  }

  /** Corner resizing keeps the frame inside the layer and above the minimum size. */
  function beginResize(event: React.PointerEvent<HTMLElement>) {
    event.stopPropagation();
    onFocus();
    (event.currentTarget.parentElement?.parentElement as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    resize.current = { startX: event.clientX, startY: event.clientY, width: geometry.width, height: geometry.height };
  }

  function moveResize(event: React.PointerEvent<HTMLElement>) {
    const state = resize.current;
    if (!state) return;
    onGeometryChange({
      ...geometry,
      width: Math.max(WINDOW_MIN_SIZE.width, Math.min(area.width - geometry.x, state.width + (event.clientX - state.startX))),
      height: Math.max(WINDOW_MIN_SIZE.height, Math.min(area.height - geometry.y, state.height + (event.clientY - state.startY))),
    });
  }

  return (
    <Rnd
      className={["workstation-window", "circa-raised", active ? "is-active" : "is-inactive"].join(" ")}
      role="dialog"
      aria-label={item.title}
      style={{ zIndex: item.z }}
      data-maximized={maximized ? "true" : undefined}
      position={{ x: geometry.x, y: geometry.y }}
      size={{ width: geometry.width, height: geometry.height }}
      disableDragging
      enableResizing={false}
      onPointerDown={onFocus}
    >
      <div className="window-titlebar" data-testid={`window-titlebar-${item.id}`}
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}>
        <span className="window-title">{item.title}</span>
        <div className="window-controls">
          <button type="button" className="window-control circa-raised" aria-label={`Minimize ${item.title}`} onClick={onMinimize}>
            <span aria-hidden="true">_</span>
          </button>
          <button type="button" className="window-control circa-raised" aria-label={`${maximized ? "Restore" : "Maximize"} ${item.title}`} onClick={onMaximize}>
            <span aria-hidden="true">{maximized ? "❐" : "□"}</span>
          </button>
          <button type="button" className="window-control window-control-close circa-raised" aria-label="Close folder" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
      <div className="window-address">
        <span>{item.status}</span>
      </div>
      <div className="window-body">
        {children}
      </div>
      {!maximized && (
        <div className="workstation-window-resize" role="presentation" aria-hidden="true"
          onPointerDown={beginResize} onPointerMove={moveResize}
          onPointerUp={() => { resize.current = null; }} onPointerCancel={() => { resize.current = null; }} />
      )}
    </Rnd>
  );
}

/** Renders every open, non-minimized window in bottom-to-top paint order. */
export function WindowLayer({ windows, area, activeId, childrenFor, ...handlers }: {
  windows: WorkstationWindowState[];
  area: DesktopArea;
  activeId: string | null;
  childrenFor: (item: WorkstationWindowState) => React.ReactNode;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onGeometryChange: (id: string, geometry: WindowGeometry) => void;
}) {
  return (
    <div className="window-layer">
      {[...windows].filter((item) => !item.minimized).sort((a, b) => a.z - b.z).map((item) => (
        <WorkstationWindow key={item.id} window={item} area={area} active={item.id === activeId}
          onFocus={() => handlers.onFocus(item.id)}
          onClose={() => handlers.onClose(item.id)}
          onMinimize={() => handlers.onMinimize(item.id)}
          onMaximize={() => handlers.onMaximize(item.id)}
          onGeometryChange={(geometry) => handlers.onGeometryChange(item.id, geometry)}>
          {childrenFor(item)}
        </WorkstationWindow>
      ))}
    </div>
  );
}

/** Titlebar entries for the taskbar, mirroring the open-window stack. */
export function TaskbarWindows({ windows, onSelect }: { windows: WorkstationWindowState[]; onSelect: (id: string) => void }) {
  return (
    <>
      {windows.map((item) => (
        <button key={item.id} type="button" className="taskbar-task-anchor taskbar-window" aria-label={item.title}
          aria-pressed={item.minimized} data-open={item.minimized ? undefined : "true"} onClick={() => onSelect(item.id)}>
          <span className="taskbar-task">
            <DesktopIcon icon={item.icon} className="taskbar-window-icon" />
            <span>{item.title}</span>
          </span>
        </button>
      ))}
    </>
  );
}
