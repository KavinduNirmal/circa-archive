import { describe, expect, it } from "vitest";
import type { DesktopIconSpec } from "@/components/desktop-icons";
import { createWorkstationStore } from "@/stores/workstation-store";

/**
 * The workstation store is the single owner of the window list and the reader's
 * trail. These tests pin the invariants the shell depends on: focus always names
 * the top visible window, closing and minimizing hand focus to a survivor, and a
 * destination that is already open is restored rather than duplicated.
 *
 * Every test builds its own store, so a leaked action or window cannot make a
 * later test pass.
 */
const area = { width: 1200, height: 700 };

const spec = (id: string, maximized = false) => ({
  id,
  title: id,
  status: "LOCATION",
  icon: { glyph: "archive" } as DesktopIconSpec,
  maximized,
});

function setup() {
  const store = createWorkstationStore();
  store.getState().setArea(area);
  return store;
}

describe("workstation store", () => {
  it("tracks the top visible window as focus moves and windows minimize", () => {
    const store = setup();
    const state = () => store.getState();
    state().open(spec("archive"), "push");
    state().open(spec("inbox"), "push");
    expect(state().lastFocused).toBe("inbox");

    state().focus("archive");
    expect(state().lastFocused).toBe("archive");

    state().minimize("archive");
    expect(state().windows.find((item) => item.id === "archive")?.minimized).toBe(true);
    // The focused window was minimized, so focus falls to the next visible one
    // rather than becoming null and leaving the shell without an active window.
    expect(state().lastFocused).toBe("inbox");
  });

  it("hands focus to a surviving window when the active one closes", () => {
    const store = setup();
    const state = () => store.getState();
    state().open(spec("archive"), "push");
    state().open(spec("inbox"), "push");
    state().minimize("inbox");
    state().close("inbox");
    expect(state().windows.map((item) => item.id)).toEqual(["archive"]);
    expect(state().lastFocused).toBe("archive");

    state().close("archive");
    expect(state().windows).toEqual([]);
    expect(state().lastFocused).toBeNull();
  });

  it("restores a minimized window to the front when reopened", () => {
    const store = setup();
    const state = () => store.getState();
    state().open(spec("archive"), "push");
    state().open(spec("inbox"), "push");
    state().minimize("archive");
    state().open(spec("archive"), "push");
    const archive = state().windows.find((item) => item.id === "archive");
    const inbox = state().windows.find((item) => item.id === "inbox");
    expect(archive?.minimized).toBe(false);
    expect(archive!.z).toBeGreaterThan(inbox!.z);
    // Reopening focuses; it must not create a second window for the same destination.
    expect(state().windows).toHaveLength(2);
    expect(state().lastFocused).toBe("archive");
  });

  it("cascades new windows inside the measured desktop area", () => {
    const store = setup();
    const state = () => store.getState();
    state().open(spec("archive"), "push");
    const [first] = state().windows;
    expect(first.geometry).toEqual({ x: 90, y: 70, width: 640, height: 460 });

    state().open(spec("inbox"), "push");
    const second = state().windows.find((item) => item.id === "inbox")!;
    expect(second.geometry.x).toBe(90 + 26);
    expect(second.geometry.y).toBe(70 + 26);
  });

  it("falls back to the viewport until the desktop layer has been measured", () => {
    const store = createWorkstationStore();
    const width = window.innerWidth;
    const height = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 });
    try {
      store.getState().open(spec("archive"), "push");
      const [opened] = store.getState().windows;
      // The frame is clamped to the viewport, not sized against a zeroed area.
      // The taskbar's height is reserved, so 400px of viewport leaves 320px for
      // frames and the minimum frame height is what survives the clamp.
      expect(opened.geometry.width).toBe(620);
      expect(opened.geometry.height).toBe(180);
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    }
  });

  it("keeps a window above its minimum size when geometry is committed", () => {
    const store = setup();
    store.getState().open(spec("archive"), "push");
    store.getState().setGeometry("archive", { x: 10, y: 10, width: 40, height: 30 });
    expect(store.getState().windows[0].geometry).toEqual({ x: 10, y: 10, width: 260, height: 180 });
  });

  it("dedupes the reader trail and keeps the forward entries", () => {
    const store = setup();
    const state = () => store.getState();
    state().openRecord("INC-00014", "Record Viewer", "push");
    state().openRecord("INC-00027", "Record Viewer", "push");
    expect(state().readerTrail).toEqual({ codes: ["INC-00014", "INC-00027"], at: 1 });

    // Revisiting a record moves the cursor; it does not append a duplicate.
    state().openRecord("INC-00014", "Record Viewer", "push");
    expect(state().readerTrail).toEqual({ codes: ["INC-00014", "INC-00027"], at: 0 });

    // Forward still returns to the record read after it.
    state().travelRecord(1);
    expect(state().readerTrail).toEqual({ codes: ["INC-00014", "INC-00027"], at: 1 });
  });

  it("truncates the forward trail when a new record is opened", () => {
    const store = setup();
    const state = () => store.getState();
    state().openRecord("A", "Record Viewer", "push");
    state().openRecord("B", "Record Viewer", "push");
    state().openRecord("C", "Record Viewer", "push");
    state().travelRecord(-1);
    state().travelRecord(-1);
    expect(state().readerTrail).toEqual({ codes: ["A", "B", "C"], at: 0 });

    state().openRecord("D", "Record Viewer", "push");
    expect(state().readerTrail).toEqual({ codes: ["A", "D"], at: 1 });
  });

  it("opens one maximized reader window whichever record is opened", () => {
    const store = setup();
    const state = () => store.getState();
    state().openRecord("INC-00014", "Record Viewer", "push");
    state().openRecord("INC-00027", "Record Viewer", "push");
    const readers = state().windows.filter((item) => item.id === "reader");
    expect(readers).toHaveLength(1);
    expect(readers[0].maximized).toBe(true);
    expect(readers[0].title).toBe("Record Viewer");
    expect(state().lastFocused).toBe("reader");
  });

  it("records why the URL should change, and clears the intent after a write", () => {
    const store = setup();
    const state = () => store.getState();
    state().open(spec("archive"), "push");
    expect(state().historyIntent).toBe("push");

    state().clearHistoryIntent();
    expect(state().historyIntent).toBeNull();

    state().focus("archive");
    expect(state().historyIntent).toBe("replace");

    state().clearHistoryIntent();
    state().setGeometry("archive", { x: 200, y: 120, width: 500, height: 300 });
    state().toggleMaximize("archive");
    expect(state().historyIntent).toBeNull();

    state().clearHistoryIntent();
    state().minimize("archive");
    expect(state().historyIntent).toBe("replace");

    state().clearHistoryIntent();
    state().close("archive");
    expect(state().historyIntent).toBe("replace");

    state().clearHistoryIntent();
    state().openRecord("INC-00014", "Record Viewer", "push");
    expect(state().historyIntent).toBe("push");

    state().openRecord("INC-00027", "Record Viewer", "push");
    state().clearHistoryIntent();
    state().travelRecord(-1);
    expect(state().historyIntent).toBe("replace");

    // A spent Back is not a navigation, so it asks for no write at all.
    state().clearHistoryIntent();
    state().travelRecord(-1);
    expect(state().historyIntent).toBeNull();
  });

  it("drops restored windows that no longer resolve and normalises the rest", () => {
    const store = setup();
    store.setState({
      windows: [
        { ...spec("archive"), geometry: { x: 0, y: 0, width: 400, height: 300 }, maximized: false, minimized: false, z: 7 },
        { ...spec("gone"), geometry: { x: 0, y: 0, width: 400, height: 300 }, maximized: false, minimized: false, z: 9 },
        { ...spec("reader"), geometry: { x: 0, y: 0, width: 400, height: 300 }, maximized: true, minimized: false, z: 4 },
      ],
      lastFocused: "gone",
      readerTrail: { codes: ["A", "B", "A"], at: 2 },
    });

    store.getState().validateRestored();

    expect(store.getState().windows.map((item) => item.id)).toEqual(["reader", "archive"]);
    expect(store.getState().windows.map((item) => item.z)).toEqual([1, 2]);
    expect(store.getState().lastFocused).toBe("archive");
    expect(store.getState().readerTrail).toEqual({ codes: ["A", "B"], at: 0 });
  });

  it("keeps the screen filter on by default and lets Settings change it", () => {
    const store = setup();
    expect(store.getState().screenFilter).toBe(true);
    store.getState().setScreenFilter(false);
    expect(store.getState().screenFilter).toBe(false);
  });
});
