import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWorkstationWindows } from "@/components/window-manager";
import type { DesktopIconSpec } from "@/components/desktop-icons";
import { createWorkstationStore } from "@/stores/workstation-store";
import { workstationWrapper } from "./intl";

/** The registry is the single source of truth for stacking, focus, and visibility. */
const area = { width: 1200, height: 700 };
const entry = (id: string) => ({ id, title: id, status: "LOCATION", icon: { glyph: "archive" } as DesktopIconSpec });

/**
 * The window hook now reads the store, so it needs a provider. `open` no longer
 * takes the desktop area: the shell measures the layer once and publishes it
 * with `setArea`, and every frame is sized from that one value.
 */
function setup() {
  const store = createWorkstationStore();
  store.getState().setArea(area);
  const { result } = renderHook(() => useWorkstationWindows(), { wrapper: workstationWrapper({ store }) });
  return result;
}

describe("workstation window registry", () => {
  it("tracks the top visible window as focus moves and windows minimize", () => {
    const result = setup();
    act(() => { result.current.open(entry("archive"), "push"); });
    act(() => { result.current.open(entry("inbox"), "push"); });
    expect(result.current.lastFocused).toBe("inbox");

    act(() => { result.current.focus("archive"); });
    expect(result.current.lastFocused).toBe("archive");

    act(() => { result.current.minimize("archive"); });
    expect(result.current.windows.find((item) => item.id === "archive")?.minimized).toBe(true);
    // The focused window was minimized, so focus falls to the next visible one
    // rather than becoming null and leaving the shell without an active window.
    expect(result.current.lastFocused).toBe("inbox");
  });

  it("hands focus to a surviving window when the active one closes", () => {
    const result = setup();
    act(() => { result.current.open(entry("archive"), "push"); });
    act(() => { result.current.open(entry("inbox"), "push"); });
    act(() => { result.current.minimize("inbox"); });
    act(() => { result.current.close("inbox"); });
    expect(result.current.windows.map((item) => item.id)).toEqual(["archive"]);
    expect(result.current.lastFocused).toBe("archive");

    act(() => { result.current.close("archive"); });
    expect(result.current.windows).toEqual([]);
    expect(result.current.lastFocused).toBeNull();
  });

  it("restores a minimized window to the front when reopened", () => {
    const result = setup();
    act(() => { result.current.open(entry("archive"), "push"); });
    act(() => { result.current.open(entry("inbox"), "push"); });
    act(() => { result.current.minimize("archive"); });
    act(() => { result.current.open(entry("archive"), "push"); });
    const archive = result.current.windows.find((item) => item.id === "archive");
    const inbox = result.current.windows.find((item) => item.id === "inbox");
    expect(archive?.minimized).toBe(false);
    expect(archive!.z).toBeGreaterThan(inbox!.z);
    // Reopening focuses; it must not create a second window for the same destination.
    expect(result.current.windows).toHaveLength(2);
    expect(result.current.lastFocused).toBe("archive");
  });
});
