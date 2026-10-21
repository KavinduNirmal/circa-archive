import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopShell } from "@/components/desktop-shell";
import { FILE_TREE } from "@/components/files/files-index";
import {
  WorkstationBoot,
  BOOT_LINE_COUNT,
  BOOT_STEP_MS,
  bootDurationMs,
  bootLines,
} from "@/components/site/boot-sequence";
import { catalogFor, renderWorkstation, translatorFor } from "./intl";

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

const english = catalogFor("en");
const ready = bootDurationMs();

/** The workstation as the locale route mounts it: the post screen in front of the shell. */
function renderPostedWorkstation(locale: "en" | "ko" = "en") {
  return renderWorkstation(
    <WorkstationBoot>
      <DesktopShell />
    </WorkstationBoot>,
    { locale },
  );
}

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
    renderPostedWorkstation();
    const boot = screen.getByRole("region", { name: english.boot.regionLabel });
    expect(boot).toBeVisible();
    // The shell is mounted behind the boot screen so the swap does not flash,
    // but it is out of the accessibility tree until the post passes.
    expect(
      screen.queryByRole("navigation", { name: english.shell.foldersLabel }),
    ).not.toBeInTheDocument();
    // The post counts the index it mounted as it goes, so the number is the real one.
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS * 2);
    });
    expect(boot).toHaveTextContent(bootLines(translatorFor("boot"))[1].detail);
    expect(boot).toHaveTextContent(String(FILE_TREE.length));

    act(() => {
      vi.advanceTimersByTime(ready);
    });
    expect(
      screen.queryByRole("region", { name: english.boot.regionLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: english.shell.foldersLabel }),
    ).toBeVisible();
  });

  it("lets the operator skip the post", () => {
    renderPostedWorkstation();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(
      screen.queryByRole("region", { name: english.boot.regionLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: english.shell.foldersLabel }),
    ).toBeVisible();
  });

  it("does not hold a reduced-motion operator at the post screen", () => {
    motionAllowed(true);
    renderPostedWorkstation();
    expect(
      screen.queryByRole("region", { name: english.boot.regionLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: english.shell.foldersLabel }),
    ).toBeVisible();
  });

  it("prints the post in Korean when the request resolves to Korean", () => {
    motionAllowed(true); // Hand over at once; the shell's own copy is what is under test.
    renderPostedWorkstation("ko");
    const korean = catalogFor("ko");
    expect(
      screen.getByRole("main", { name: korean.shell.desktopLabel }),
    ).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: korean.shell.foldersLabel }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: korean.shell.startLabel }),
    ).toBeVisible();
  });

  it("keeps the declared line count in step with the lines the post actually prints", () => {
    // The duration is computed from the count, so a line added without bumping the
    // count would cut the post short by one step.
    expect(bootLines(translatorFor("boot"))).toHaveLength(BOOT_LINE_COUNT);
  });

  it("gives the Korean post the same number of lines, with the same measured figures", () => {
    const lines = bootLines(translatorFor("boot", "ko"));
    expect(lines).toHaveLength(BOOT_LINE_COUNT);
    // The counts are data, so they must not change with the language.
    expect(lines[1].detail).toContain(String(FILE_TREE.length));
    expect(lines[0].detail).not.toBe(
      bootLines(translatorFor("boot"))[0].detail,
    );
  });
});
