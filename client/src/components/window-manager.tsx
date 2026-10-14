"use client";

import { useCallback, useRef, useState, type Ref } from "react";
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
    // No-op for the window that is already on top, so a drag does not re-render the shell.
    setLastFocused((current) => (current === id ? current : id));
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
 * The frame's geometry lives in the registry, but a drag or resize writes
 * straight to the DOM and only commits on release. Routing every pointer move
 * through React re-rendered the whole shell (status strip, rail, taskbar) at
 * pointer frequency, which is what made dragging feel like it ran behind the
 * cursor. Pointer capture lives on the titlebar, so release always lands on the
 * handler that started the gesture.
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
  const frameNode = useRef<HTMLElement | null>(null);
  const frameRef = useCallback((node: Rnd | null) => { frameNode.current = node?.resizableElement?.current ?? null; }, []);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number; next: WindowGeometry } | null>(null);
  const resize = useRef<{ startX: number; startY: number; width: number; height: number; next: WindowGeometry } | null>(null);

  function paint(next: WindowGeometry) {
    const frame = frameNode.current;
    if (!frame) return;
    frame.style.left = `${next.x}px`;
    frame.style.top = `${next.y}px`;
    frame.style.width = `${next.width}px`;
    frame.style.height = `${next.height}px`;
  }

  /** Starts a titlebar drag; the frame is clamped to the desktop layer as it moves. */
  function beginDrag(event: React.PointerEvent<HTMLElement>) {
    onFocus();
    if (maximized || (event.target as HTMLElement).closest("button")) return;
    // Capture keeps the gesture on the frame even when the pointer outruns it.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, originX: geometry.x, originY: geometry.y, next: geometry };
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state) return;
    const maxX = Math.max(0, area.width - state.next.width);
    const maxY = Math.max(0, area.height - state.next.height);
    state.next = {
      ...state.next,
      x: Math.min(maxX, Math.max(0, state.originX + (event.clientX - state.startX))),
      y: Math.min(maxY, Math.max(0, state.originY + (event.clientY - state.startY))),
    };
    paint(state.next);
  }

  function endDrag() {
    const state = drag.current;
    drag.current = null;
    if (state && (state.next.x !== geometry.x || state.next.y !== geometry.y)) onGeometryChange(state.next);
  }

  /** Starts a corner resize; the commit happens once on release, like the drag. */
  function beginResize(event: React.PointerEvent<HTMLElement>) {
    event.stopPropagation();
    onFocus();
    // Capture keeps the gesture on the frame even when the pointer outruns it.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resize.current = { startX: event.clientX, startY: event.clientY, width: geometry.width, height: geometry.height, next: geometry };
  }

  function moveResize(event: React.PointerEvent<HTMLElement>) {
    const state = resize.current;
    if (!state) return;
    state.next = {
      ...state.next,
      width: Math.max(WINDOW_MIN_SIZE.width, Math.min(area.width - geometry.x, state.width + (event.clientX - state.startX))),
      height: Math.max(WINDOW_MIN_SIZE.height, Math.min(area.height - geometry.y, state.height + (event.clientY - state.startY))),
    };
    paint(state.next);
  }

  function endResize() {
    const state = resize.current;
    resize.current = null;
    if (state && (state.next.width !== geometry.width || state.next.height !== geometry.height)) onGeometryChange(state.next);
  }

  return (
    <Rnd
      ref={frameRef as unknown as Ref<Rnd>}
      className={["workstation-window", "circa-raised", active ? "is-active" : "is-inactive"].join(" ")}
      role="dialog"
      aria-label={item.title}
      // Explicit geometry wins over react-rnd's internal transform, which keeps
      // the frame and the registry in step for the whole gesture and after it.
      style={{ zIndex: item.z, left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height }}
      data-maximized={maximized ? "true" : undefined}
      size={{ width: geometry.width, height: geometry.height }}
      position={{ x: geometry.x, y: geometry.y }}
      disableDragging
      enableResizing={false}
      onPointerDown={onFocus}
    >
      <div className="window-titlebar" data-testid={`window-titlebar-${item.id}`}
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
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
          onPointerUp={endResize} onPointerCancel={endResize} />
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
