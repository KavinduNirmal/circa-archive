import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Desktop from "@/app/desktop/page";
import { FILE_TREE } from "@/components/files/files-index";
import { BOOT_STEP_MS, bootDurationMs, bootLines } from "@/components/site/boot-sequence";

/**
 * The desktop boots once per load, the way a machine does, and the screen in
 * front of it is inert until the shell reports ready. Tests drive the timers by
 * hand so the handover is asserted rather than waited out.
 */
function motionAllowed(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: matches && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
}

const ready = bootDurationMs();

describe("workstation boot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motionAllowed(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("posts before it hands the screen over, and reports the archive it mounted", () => {
    render(<Desktop />);
    const boot = screen.getByRole("region", { name: "Workstation boot" });
    expect(boot).toBeVisible();
    // The shell is mounted behind the boot screen so the swap does not flash,
    // but it is out of the accessibility tree until the post passes.
    expect(screen.queryByRole("navigation", { name: "Desktop folders" })).not.toBeInTheDocument();
    // The post counts the index it mounted as it goes, so the number is the real one.
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS * 2);
    });
    expect(boot).toHaveTextContent(bootLines()[1].detail);
    expect(boot).toHaveTextContent(String(FILE_TREE.length));

    act(() => {
      vi.advanceTimersByTime(ready);
    });
    expect(screen.queryByRole("region", { name: "Workstation boot" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Desktop folders" })).toBeVisible();
  });

  it("lets the operator skip the post", () => {
    render(<Desktop />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("region", { name: "Workstation boot" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Desktop folders" })).toBeVisible();
  });

  it("does not hold a reduced-motion operator at the post screen", () => {
    motionAllowed(true);
    render(<Desktop />);
    expect(screen.queryByRole("region", { name: "Workstation boot" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Desktop folders" })).toBeVisible();
  });
});
