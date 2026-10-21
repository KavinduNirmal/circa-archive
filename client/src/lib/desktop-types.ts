import type { DesktopIconSpec } from "@/components/desktop-icons";

/**
 * The desktop's state contracts.
 *
 * These live outside the components so the workstation store can own the state
 * without importing a `"use client"` module for its types. `DesktopIconSpec` is
 * imported as a type on purpose: the frame renders artwork, the store only
 * carries the descriptor, and a type import leaves no component in the store's
 * module graph.
 */

/** Pixel geometry of a workstation window, in desktop-layer coordinates. */
export type WindowGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Bounds of the desktop area, excluding the status strip and the taskbar. */
export type DesktopArea = { width: number; height: number };

/**
 * Everything needed to open one window.
 *
 * `id` is the destination id (or `"reader"`), which is also the window's stable
 * key: opening a spec whose id is already open focuses the existing frame.
 */
export type WindowSpec = {
  id: string;
  title: string;
  /**
   * Uppercase status shown in the window's own status strip. Applications that
   * carry their own status bar (the archive browser) leave this null so the
   * frame does not stack a second, duplicate strip above them.
   */
  status: string | null;
  icon: DesktopIconSpec;
  /** Set when the frame should fill the desktop layer on open. */
  maximized?: boolean;
};

export type WorkstationWindowState = {
  /** Stable key: the destination id, so reopening focuses instead of duplicating. */
  id: string;
  title: string;
  status: string | null;
  icon: DesktopIconSpec;
  /** Geometry used when not maximized; kept so restore never loses the frame. */
  geometry: WindowGeometry;
  maximized: boolean;
  minimized: boolean;
  /** Monotonic counter that decides paint order. */
  z: number;
};

export const WINDOW_MIN_SIZE = { width: 260, height: 180 } as const;

/** Cascading offsets so a new window never lands exactly under the previous one. */
export const CASCADE_STEP = 26;
export const CASCADE_WRAP = 6;

/** The one clamp a committed geometry must not pass: a frame below its usable size. */
export function clampGeometrySize(geometry: WindowGeometry): WindowGeometry {
  return {
    ...geometry,
    width: Math.max(WINDOW_MIN_SIZE.width, geometry.width),
    height: Math.max(WINDOW_MIN_SIZE.height, geometry.height),
  };
}
