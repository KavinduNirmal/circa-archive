"use client";

import { useCallback, useRef, useState } from "react";
import { DesktopIcon, type DesktopIconSpec } from "./desktop-icons";

/** Pixel geometry of a workstation window, in desktop-layer coordinates. */
export type WindowGeometry = { x: number; y: number; width: number; height: number };

/** Bounds of the desktop area, excluding the status strip and the taskbar. */
export type DesktopArea = { width: number; height: number };

export type WorkstationWindowState = {
  /** Stable key: the destination id, so reopening focuses instead of duplicating. */
  id: string;
  title: string;
  /**
   * Uppercase status shown in the window's own status strip. Applications that
   * carry their own status bar (the archive browser) leave this null so the
   * frame does not stack a second, duplicate strip above them.
   */
  status: string | null;
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

  // The active window is always the top visible one, which keeps a stale id from
  // surviving a close or a minimize and handing focus to a window that is gone.
  const activeId = (list: WorkstationWindowState[]) =>
    [...list].filter((item) => !item.minimized).sort((a, b) => b.z - a.z)[0]?.id ?? null;

  const focus = useCallback((id: string) => {
    setLastFocused(id);
    setWindows((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;
      const top = current.reduce((max, item) => Math.max(max, item.z), 0);
      // Already on top and visible: leave the list untouched so a drag does not re-render.
      if (target.z === top && !target.minimized) return current;
      return current.map((item) => (item.id === id ? { ...item, z: top + 1, minimized: false } : item));
    });
  }, []);

  const open = useCallback((entry: { id: string; title: string; status: string | null; icon: DesktopIconSpec }, area: DesktopArea) => {
    setLastFocused(entry.id);
    setWindows((current) => {
      const existing = current.find((item) => item.id === entry.id);
      const top = current.reduce((max, item) => Math.max(max, item.z), 0);
      if (existing) return current.map((item) => (item.id === entry.id ? { ...item, z: top + 1, minimized: false } : item));
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
    setWindows((current) => {
      const next = current.filter((item) => item.id !== id);
      setLastFocused((active) => (active === id ? activeId(next) : active));
      return next;
    });
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, minimized: true } : item));
      setLastFocused((active) => (active === id ? activeId(next) : active));
      return next;
    });
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((current) => current.map((item) => (item.id === id ? { ...item, maximized: !item.maximized, minimized: false } : item)));
  }, []);

  const setGeometry = useCallback((id: string, geometry: WindowGeometry) => {
    setWindows((current) => current.map((item) => (item.id === id
      ? { ...item, geometry: { ...geometry, width: Math.max(WINDOW_MIN_SIZE.width, geometry.width), height: Math.max(WINDOW_MIN_SIZE.height, geometry.height) } }
      : item)));
  }, []);

  return { windows, lastFocused, open, close, focus, minimize, toggleMaximize, setGeometry };
}

/**
 * One draggable, resizable workstation window.
 *
 * The frame is a plain element positioned with explicit `left`/`top`/size, and
 * gestures are pointer handlers. react-rnd was tried first and removed from
 * rendering: it always writes its own `transform` and will not yield to inline
 * geometry, so a controlled position was applied twice (the frame sitting 90px
 * off and past the viewport edge) and the drag only took effect when the
 * gesture committed, which read as the window snapping somewhere else on
 * release. A gesture paints the frame directly and commits once on release.
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
  const frameRef = useRef<HTMLElement | null>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; next: WindowGeometry } | null>(null);
  const resize = useRef<{ pointerId: number; startX: number; startY: number; width: number; height: number; next: WindowGeometry } | null>(null);

  function paint(next: WindowGeometry) {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.left = `${next.x}px`;
    frame.style.top = `${next.y}px`;
    frame.style.width = `${next.width}px`;
    frame.style.height = `${next.height}px`;
  }

  function clampX(value: number, width: number) {
    return Math.min(Math.max(0, area.width - width), Math.max(0, value));
  }

  function clampY(value: number, height: number) {
    return Math.min(Math.max(0, area.height - height), Math.max(0, value));
  }

  /** Starts a titlebar drag; the frame follows the pointer and is clamped to the layer. */
  function beginDrag(event: React.PointerEvent<HTMLElement>) {
    onFocus();
    // `button` is absent on some pointer events, so only reject an explicit secondary button.
    if (maximized || event.button > 0 || (event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: geometry.x, originY: geometry.y, next: geometry };
    // Safety net for a release the frame never sees, so a gesture can never outlive its pointer.
    window.addEventListener("pointerup", endDrag);
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    state.next = {
      ...state.next,
      x: clampX(state.originX + (event.clientX - state.startX), state.next.width),
      y: clampY(state.originY + (event.clientY - state.startY), state.next.height),
    };
    paint(state.next);
  }

  function endDrag() {
    const state = drag.current;
    drag.current = null;
    window.removeEventListener("pointerup", endDrag);
    if (state && (state.next.x !== geometry.x || state.next.y !== geometry.y)) onGeometryChange(state.next);
  }

  /** Starts a corner resize; the commit happens once on release, like the drag. */
  function beginResize(event: React.PointerEvent<HTMLElement>) {
    event.stopPropagation();
    onFocus();
    if (event.button > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resize.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, width: geometry.width, height: geometry.height, next: geometry };
    window.addEventListener("pointerup", endResize);
  }

  function moveResize(event: React.PointerEvent<HTMLElement>) {
    const state = resize.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const width = Math.max(WINDOW_MIN_SIZE.width, Math.min(area.width - geometry.x, state.width + (event.clientX - state.startX)));
    const height = Math.max(WINDOW_MIN_SIZE.height, Math.min(area.height - geometry.y, state.height + (event.clientY - state.startY)));
    state.next = { ...state.next, width, height };
    paint(state.next);
  }

  function endResize() {
    const state = resize.current;
    resize.current = null;
    window.removeEventListener("pointerup", endResize);
    if (state && (state.next.width !== geometry.width || state.next.height !== geometry.height)) onGeometryChange(state.next);
  }

  return (
    <section
      ref={(node) => { frameRef.current = node; }}
      className={["workstation-window", "circa-raised", active ? "is-active" : "is-inactive"].join(" ")}
      role="dialog"
      aria-label={item.title}
      data-maximized={maximized ? "true" : undefined}
      style={{ zIndex: item.z, left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height }}
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
      {item.status !== null && (
        <div className="window-address">
          <span>{item.status}</span>
        </div>
      )}
      <div className="window-body">
        {children}
      </div>
      {!maximized && (
        <div className="workstation-window-resize" role="presentation" aria-hidden="true"
          onPointerDown={beginResize} onPointerMove={moveResize}
          onPointerUp={endResize} onPointerCancel={endResize} />
      )}
    </section>
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

/**
 * Titlebar entries for the taskbar, mirroring the open-window stack. An entry is
 * pressed while its window is open and pressed further while it holds focus, the
 * same way the Settings task item shows its own state.
 */
export function TaskbarWindows({ windows, activeId, onSelect }: {
  windows: WorkstationWindowState[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {windows.map((item) => (
        <button key={item.id} type="button"
          className={["taskbar-task-anchor", "taskbar-window", item.id === activeId ? "is-active" : null].filter(Boolean).join(" ")}
          aria-label={item.title}
          aria-pressed={item.minimized}
          data-open={item.minimized ? undefined : "true"}
          data-active={item.id === activeId ? "true" : undefined}
          onClick={() => onSelect(item.id)}>
          <span className="taskbar-task">
            <DesktopIcon icon={item.icon} className="taskbar-window-icon" />
            <span>{item.title}</span>
          </span>
        </button>
      ))}
    </>
  );
}
