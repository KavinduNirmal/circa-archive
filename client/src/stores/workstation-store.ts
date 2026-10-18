import { createStore, type StoreApi } from "zustand/vanilla";
import { isDestinationId } from "@/lib/desktop-destinations";
import {
  CASCADE_STEP,
  CASCADE_WRAP,
  WINDOW_MIN_SIZE,
  clampGeometrySize,
  type DesktopArea,
  type WindowGeometry,
  type WindowSpec,
  type WorkstationWindowState,
} from "@/lib/desktop-types";
import { readerWindowSpec } from "@/lib/desktop-windows";
import { EMPTY_TRAIL, normaliseTrail, openInTrail, stepTrail, type RecordTrail } from "@/lib/record-trail";

/**
 * The workstation's state container.
 *
 * A store factory rather than a module-global singleton: Next renders on the
 * server, and the tests render the shell many times in one process. Both need a
 * store that starts from the same state and is never shared by accident. The
 * shell mounts it once per workspace layout through
 * `WorkstationStoreProvider`.
 *
 * Two rules keep this module honest:
 *
 * 1. No translated copy. Titles arrive with their spec, because the store cannot
 *    read a message catalog and should not try.
 * 2. No routing. Actions record *why* the URL should change in `historyIntent`;
 *    one component reads that and writes the address. A store that called the
 *    router would put navigation in the middle of every window operation.
 */

/** Why the address bar should move after an action: a new document, or the same position. */
export type HistoryIntent = "push" | "replace" | null;

export type WorkstationStore = {
  windows: WorkstationWindowState[];
  lastFocused: string | null;
  readerTrail: RecordTrail;
  screenFilter: boolean;
  area: DesktopArea;
  /** Read and cleared by the URL sync; not persisted, because it describes one write. */
  historyIntent: HistoryIntent;
  /** False until restored state has been merged and validated. True when persistence is off. */
  hydrated: boolean;

  /** Open or focus a destination. `intent` decides whether the URL pushes or replaces. */
  open(spec: WindowSpec, intent: Exclude<HistoryIntent, null>): void;
  /** Open a record in the single reader, moving the trail cursor when it is already in the trail. */
  openRecord(code: string, title: string, intent: Exclude<HistoryIntent, null>): void;
  close(id: string): void;
  focus(id: string): void;
  minimize(id: string): void;
  toggleMaximize(id: string): void;
  setGeometry(id: string, geometry: WindowGeometry): void;
  travelRecord(delta: 1 | -1): void;
  setScreenFilter(next: boolean): void;
  setArea(area: DesktopArea): void;
  clearHistoryIntent(): void;
  /** Repairs restored state: drops frames that no longer resolve and normalises stacking. */
  validateRestored(): void;
};

/**
 * The active window is always the top visible one, so focus can never name a
 * window that a close or a minimize has already taken away.
 */
function activeId(windows: readonly WorkstationWindowState[]): string | null {
  return [...windows]
    .filter((item) => !item.minimized)
    .sort((a, b) => b.z - a.z)[0]?.id ?? null;
}

function topZ(windows: readonly WorkstationWindowState[]): number {
  return windows.reduce((max, item) => Math.max(max, item.z), 0);
}

/**
 * The layer may not have been measured yet on the first click, so a frame is
 * sized against the viewport when `area` is still empty.
 */
function usableArea(area: DesktopArea): DesktopArea {
  if (area.width && area.height) return area;
  if (typeof window === "undefined") return { width: 1024, height: 700 };
  return { width: window.innerWidth, height: Math.max(240, window.innerHeight - 80) };
}

/**
 * Opening is idempotent by id: a destination that is already open is raised and
 * restored rather than duplicated. A window that opens full screen still does on
 * a second request, but a frame the operator restored by hand is not overridden
 * by another open.
 */
function openPartial(
  state: WorkstationStore,
  spec: WindowSpec,
  intent: Exclude<HistoryIntent, null>,
): Partial<WorkstationStore> {
  const top = topZ(state.windows);
  const existing = state.windows.find((item) => item.id === spec.id);
  if (existing) {
    return {
      windows: state.windows.map((item) => (item.id === spec.id
        ? { ...item, z: top + 1, minimized: false, maximized: item.maximized || Boolean(spec.maximized) }
        : item)),
      lastFocused: spec.id,
      historyIntent: intent,
    };
  }

  const area = usableArea(state.area);
  const step = (state.windows.length % CASCADE_WRAP) * CASCADE_STEP;
  return {
    windows: [...state.windows, {
      id: spec.id,
      title: spec.title,
      status: spec.status,
      icon: spec.icon,
      geometry: {
        x: 90 + step,
        y: 70 + step,
        // Wide enough for the file browser's tree pane and a four-column
        // details listing side by side, which is the widest default window.
        width: Math.max(WINDOW_MIN_SIZE.width, Math.min(640, area.width - 180 - step)),
        height: Math.max(WINDOW_MIN_SIZE.height, Math.min(460, area.height - 140 - step)),
      },
      maximized: Boolean(spec.maximized),
      minimized: false,
      z: top + 1,
    }],
    lastFocused: spec.id,
    historyIntent: intent,
  };
}

/**
 * A restored window list, repaired.
 *
 * Storage is untrusted: a payload may contain duplicate ids, ids that no longer
 * name a destination, and a `z` that does not start at one. Keep the top frame
 * for each id, drop what cannot open, and renumber paint order from the bottom.
 */
function restoredWindows(windows: readonly WorkstationWindowState[]): WorkstationWindowState[] {
  const seen = new Set<string>();
  const kept: WorkstationWindowState[] = [];
  for (const item of [...windows].sort((a, b) => b.z - a.z)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (item.id === "reader" || isDestinationId(item.id)) kept.push(item);
  }
  return kept.reverse().map((item, index) => ({ ...item, z: index + 1 }));
}

const initialState = () => ({
  windows: [] as WorkstationWindowState[],
  lastFocused: null as string | null,
  readerTrail: EMPTY_TRAIL,
  screenFilter: true,
  area: { width: 0, height: 0 } as DesktopArea,
  historyIntent: null as HistoryIntent,
  hydrated: true,
});

export function createWorkstationStore(): StoreApi<WorkstationStore> {
  return createStore<WorkstationStore>()((set) => ({
    ...initialState(),

    open: (spec, intent) => set((state) => openPartial(state, spec, intent)),

    openRecord: (code, title, intent) => set((state) => ({
      ...openPartial(state, readerWindowSpec(title), intent),
      readerTrail: openInTrail(state.readerTrail, code),
    })),

    close: (id) => set((state) => {
      const windows = state.windows.filter((item) => item.id !== id);
      return {
        windows,
        lastFocused: state.lastFocused === id ? activeId(windows) : state.lastFocused,
        historyIntent: "replace",
      };
    }),

    focus: (id) => set((state) => {
      const target = state.windows.find((item) => item.id === id);
      if (!target) return { lastFocused: id, historyIntent: "replace" };
      const top = topZ(state.windows);
      // Already on top and visible: leave the list untouched so a click does not re-render.
      if (target.z === top && !target.minimized) {
        return { lastFocused: id, historyIntent: "replace" };
      }
      return {
        windows: state.windows.map((item) => (item.id === id ? { ...item, z: top + 1, minimized: false } : item)),
        lastFocused: id,
        historyIntent: "replace",
      };
    }),

    minimize: (id) => set((state) => {
      const windows = state.windows.map((item) => (item.id === id ? { ...item, minimized: true } : item));
      return {
        windows,
        lastFocused: state.lastFocused === id ? activeId(windows) : state.lastFocused,
        historyIntent: "replace",
      };
    }),

    toggleMaximize: (id) => set((state) => ({
      windows: state.windows.map((item) => (item.id === id
        ? { ...item, maximized: !item.maximized, minimized: false }
        : item)),
    })),

    setGeometry: (id, geometry) => set((state) => ({
      windows: state.windows.map((item) => (item.id === id
        ? { ...item, geometry: clampGeometrySize(geometry) }
        : item)),
    })),

    travelRecord: (delta) => set((state) => {
      const readerTrail = stepTrail(state.readerTrail, delta);
      // A spent Back/Forward is not a navigation; do not ask the URL to move.
      return readerTrail === state.readerTrail ? {} : { readerTrail, historyIntent: "replace" };
    }),

    setScreenFilter: (next) => set({ screenFilter: next }),

    setArea: (area) => set({ area }),

    clearHistoryIntent: () => set({ historyIntent: null }),

    validateRestored: () => set((state) => {
      const readerTrail = normaliseTrail(state.readerTrail);
      // The reader's resource is the record the trail points at, so a reader with
      // no record has nothing to show and is dropped with the rest.
      const windows = restoredWindows(state.windows)
        .filter((item) => item.id !== "reader" || readerTrail.codes.length > 0)
        .map((item, index) => ({ ...item, z: index + 1 }));
      const focusedSurvives = windows.some((item) => item.id === state.lastFocused && !item.minimized);
      return {
        windows,
        readerTrail,
        lastFocused: focusedSurvives ? state.lastFocused : activeId(windows),
      };
    }),
  }));
}
