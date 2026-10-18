import { createStore, type StoreApi } from "zustand/vanilla";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
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

/** The part of the workspace that survives a tab reload. */
export type PersistedWorkstationState = Pick<
  WorkstationStore,
  "windows" | "lastFocused" | "readerTrail" | "screenFilter" | "area"
>;

/** The slice of zustand's persist API the provider needs. */
export type WorkstationPersistApi = {
  hasHydrated: () => boolean;
  rehydrate: () => Promise<void> | void;
  onFinishHydration: (listener: () => void) => () => void;
};

/** A store, with the persistence API present only when the store was persisted. */
export type WorkstationStoreApi = StoreApi<WorkstationStore> & { persist?: WorkstationPersistApi };

export const STORAGE_KEY = "circa.workstation.v1";

/** The active window is always the top visible one, so focus never names a window that is gone. */
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

/** Keeps a frame inside the measured layer without shrinking it below its usable size. */
function clampToArea(geometry: WindowGeometry, area: DesktopArea): WindowGeometry {
  const min = clampGeometrySize(geometry);
  const width = Math.min(min.width, Math.max(WINDOW_MIN_SIZE.width, area.width));
  const height = Math.min(min.height, Math.max(WINDOW_MIN_SIZE.height, area.height));
  return {
    width,
    height,
    x: Math.min(Math.max(0, geometry.x), Math.max(0, area.width - width)),
    y: Math.min(Math.max(0, geometry.y), Math.max(0, area.height - height)),
  };
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

type SetState = (partial: Partial<WorkstationStore> | ((state: WorkstationStore) => Partial<WorkstationStore>)) => void;

/**
 * The state and every action, shared by the plain and persisted factories.
 *
 * `hydrated` is a parameter because it is the one field that differs: a store
 * without persistence is ready immediately, and a persisted one must not let the
 * URL adapter or the shell act until the stored workspace has been validated.
 */
function createWorkstationState(set: SetState, hydrated: boolean): WorkstationStore {
  return {
    windows: [],
    lastFocused: null,
    readerTrail: EMPTY_TRAIL,
    screenFilter: true,
    area: { width: 0, height: 0 },
    historyIntent: null,
    hydrated,

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

    /*
     * The desktop layer's first measurement is what makes restored geometry
     * trustworthy, so every frame is pulled back inside the new bounds. This is
     * also the clamp that runs after a window resize.
     */
    setArea: (next) => set((state) => {
      const measured = next.width > 0 && next.height > 0;
      const windows = measured
        ? state.windows.map((item) => ({ ...item, geometry: clampToArea(item.geometry, next) }))
        : state.windows;
      return { area: next, windows };
    }),

    clearHistoryIntent: () => set({ historyIntent: null }),

    validateRestored: () => set((state) => {
      const readerTrail = normaliseTrail(state.readerTrail);
      // The reader's resource is the record the trail points at, so a reader with
      // no record has nothing to show and is dropped with the rest.
      const measured = state.area.width > 0 && state.area.height > 0;
      const windows = restoredWindows(state.windows)
        .filter((item) => item.id !== "reader" || readerTrail.codes.length > 0)
        .map((item, index) => ({
          ...item,
          geometry: measured ? clampToArea(item.geometry, state.area) : item.geometry,
          z: index + 1,
        }));
      const focusedSurvives = windows.some((item) => item.id === state.lastFocused && !item.minimized);
      return {
        windows,
        readerTrail,
        lastFocused: focusedSurvives ? state.lastFocused : activeId(windows),
        // The stored workspace is now the desktop's workspace.
        hydrated: true,
      };
    }),
  };
}

/** A workstation store with no persistence. The shell tests use this. */
export function createWorkstationStore(): WorkstationStoreApi {
  return createStore<WorkstationStore>()((set) => createWorkstationState(set, true));
}

/**
 * Per-tab session storage, written defensively.
 *
 * `sessionStorage` is partitioned by tab and cleared when the tab closes, which
 * matches a workspace rather than a saved profile. It can throw (private mode,
 * quota) and it can hold a payload written by an older build, so reads and
 * writes are guarded and a malformed value is treated as "nothing stored".
 */
function sessionStorageBacked(): PersistStorage<PersistedWorkstationState> {
  const storage = () => (typeof window === "undefined" ? null : window.sessionStorage);
  /*
   * No write is accepted until the stored payload has been read. The shell
   * publishes the measured desktop area on mount, which is a store write, and
   * a write before hydration would overwrite the saved workspace with the empty
   * one that is being restored. Reading is the point after which overwriting is
   * the correct thing to do.
   */
  let read = false;
  return {
    getItem: (name) => {
      try {
        const raw = storage()?.getItem(name) ?? null;
        if (raw === null) return null;
        return JSON.parse(raw) as StorageValue<PersistedWorkstationState>;
      } catch {
        return null;
      } finally {
        read = true;
      }
    },
    setItem: (name, value) => {
      if (!read) return;
      try {
        storage()?.setItem(name, JSON.stringify(value));
      } catch {
        // A tab that refuses storage still gets a working desktop.
      }
    },
    removeItem: (name) => {
      try {
        storage()?.removeItem(name);
      } catch {
        // Nothing to clean up.
      }
    },
  };
}

/**
 * The workstation that survives a refresh.
 *
 * `skipHydration` keeps the first client render identical to the server's: the
 * provider rehydrates after mount and then validates what arrived. Nothing here
 * runs at module scope, so a server render never touches storage.
 */
export function createPersistedWorkstationStore(
  options: { storage?: PersistStorage<PersistedWorkstationState> } = {},
): WorkstationStoreApi {
  const store = createStore<WorkstationStore>()(
    persist(
      (set) => createWorkstationState(set, false),
      {
        name: STORAGE_KEY,
        version: 1,
        storage: options.storage ?? sessionStorageBacked(),
        skipHydration: true,
        partialize: (state): PersistedWorkstationState => ({
          windows: state.windows,
          lastFocused: state.lastFocused,
          readerTrail: state.readerTrail,
          screenFilter: state.screenFilter,
          area: state.area,
        }),
        /*
         * A restore must never erase something that happened before it landed.
         * The boot screen makes that window of time tiny, but a deep link or a
         * fast click owns the desktop if it got there first.
         */
        merge: (persisted, current) => {
          const live = current as WorkstationStore;
          if (live.windows.length > 0 || live.lastFocused !== null || live.readerTrail.codes.length > 0) {
            return current;
          }
          return { ...current, ...(persisted as PersistedWorkstationState) };
        },
      },
    ),
  );
  // The persist middleware adds `persist` to the store's API at runtime.
  return store as unknown as WorkstationStoreApi;
}
