import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

/**
 * jsdom performs no layout, so these stubs give the desktop layer and window
 * frames believable metrics; they do not fake window behaviour itself.
 */
/**
 * jsdom performs no layout. These stubs give the desktop layer and window
 * frames believable metrics, and `getBoundingClientRect` honours each frame's
 * inline transform and size, so measurements stay consistent as a gesture moves
 * the frame.
 */
function stubLayout() {
  const frame = () => screen.queryByRole("dialog");
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    const width = this.classList.contains("workstation-window") || this.classList.contains("desktop-area") ? 1200 : 0;
    const height = width ? 700 : 0;
    const matrix = this.style.transform.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
    const x = (Number.isFinite(parseInt(this.style.left, 10)) ? parseInt(this.style.left, 10) : 0) + (matrix ? matrix[4] : 0);
    const y = (Number.isFinite(parseInt(this.style.top, 10)) ? parseInt(this.style.top, 10) : 0) + (matrix ? matrix[5] : 0);
    return { x, y, width, height, top: 40 + y, left: x, right: x + width, bottom: 40 + y + height, toJSON: () => ({}) } as DOMRect;
  };
  // The shell measures the desktop layer with clientWidth/clientHeight, which jsdom reports as 0.
  Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, get: () => 1200 });
  Object.defineProperty(Element.prototype, "clientHeight", { configurable: true, get: () => 700 });
  Object.defineProperty(Element.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      const value = parseInt(this.style.width, 10);
      return Number.isFinite(value) && value > 0 ? value : 1200;
    },
  });
  Object.defineProperty(Element.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      const value = parseInt(this.style.height, 10);
      return Number.isFinite(value) && value > 0 ? value : 700;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", { configurable: true, get: () => 0 });
  Object.defineProperty(HTMLElement.prototype, "offsetTop", { configurable: true, get: () => 0 });
  void frame;
}

async function openArchive() {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: "Archive" }));
  const windowFrame = screen.getByRole("dialog", { name: "Archive" });
  return { user, windowFrame };
}

function dragBy(handle: HTMLElement, dx: number, dy: number) {
  fireEvent.pointerDown(handle, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientX: 10 + dx, clientY: 10 + dy, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientX: 10 + dx, clientY: 10 + dy, pointerId: 1 });
}

function resizeBy(handle: HTMLElement, dx: number, dy: number) {
  fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, pointerId: 2 });
  fireEvent.pointerMove(handle, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 2 });
  fireEvent.pointerUp(handle, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 2 });
}

/** Size is authoritative in the DOM; position is asserted as relative movement. */
function frameSize(frame: HTMLElement) {
  return { w: parseInt(frame.style.width, 10), h: parseInt(frame.style.height, 10) };
}

/** Drags and resizes write explicit left/top, so geometry reads straight off the frame. */
function frameOrigin(frame: HTMLElement) {
  return { x: parseInt(frame.style.left, 10), y: parseInt(frame.style.top, 10) };
}

describe("workstation windows", () => {
  it("opens a destination as a movable window inside the desktop area", async () => {
    stubLayout();
    const { windowFrame } = await openArchive();
    expect(windowFrame).toHaveClass("workstation-window");
    expect(windowFrame).toHaveAttribute("role", "dialog");
    // A window opens inset from the layer edge rather than flush against it.
    const left = parseInt(windowFrame.style.left, 10);
    const top = parseInt(windowFrame.style.top, 10);
    expect(Number.isFinite(left) ? left : 0).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(top) ? top : 0).toBeGreaterThanOrEqual(0);
    await waitFor(() => expect(frameSize(windowFrame)).toEqual({ w: 520, h: 400 }));
  });

  it("moves a window by dragging its titlebar", async () => {
    stubLayout();
    const { windowFrame } = await openArchive();
    const titlebar = screen.getByTestId("window-titlebar-archive");
    const start = frameOrigin(windowFrame);
    dragBy(titlebar, 120, 60);
    await waitFor(() => expect(frameOrigin(windowFrame)).toEqual({ x: start.x + 120, y: start.y + 60 }));
    // The committed position is the position that was dragged, not a re-derived one.
    expect(frameOrigin(windowFrame)).toEqual({ x: 210, y: 130 });
  });

  it("resizes a window from its resize handle", async () => {
    stubLayout();
    const { windowFrame } = await openArchive();
    const before = frameSize(windowFrame);
    const handle = windowFrame.querySelector<HTMLElement>(".workstation-window-resize");
    if (!handle) throw new Error("window is missing its resize handle");
    resizeBy(handle, 140, 90);
    await waitFor(() => expect(frameSize(windowFrame)).toEqual({ w: before.w + 140, h: before.h + 90 }));
  });

  it("minimizes to the taskbar and restores from it", async () => {
    stubLayout();
    const { user } = await openArchive();
    await user.click(screen.getByRole("button", { name: "Minimize Archive" }));
    expect(screen.queryByRole("dialog", { name: "Archive" })).not.toBeInTheDocument();
    const taskbar = screen.getByRole("contentinfo", { name: "Taskbar" });
    const taskEntry = within(taskbar).getByRole("button", { name: "Archive" });
    await user.click(taskEntry);
    expect(screen.getByRole("dialog", { name: "Archive" })).toBeVisible();
    expect(taskEntry).toHaveAttribute("aria-pressed", "false");
  });

  it("maximizes to the desktop area and restores the previous geometry", async () => {
    stubLayout();
    const { user, windowFrame } = await openArchive();
    const before = frameSize(windowFrame);
    await user.click(screen.getByRole("button", { name: "Maximize Archive" }));
    await waitFor(() => expect(frameSize(windowFrame)).toEqual({ w: 1200, h: 700 }));
    expect(windowFrame).toHaveAttribute("data-maximized", "true");
    expect(windowFrame.querySelector(".workstation-window-resize")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Restore Archive" }));
    await waitFor(() => expect(frameSize(windowFrame)).toEqual(before));
    expect(windowFrame).not.toHaveAttribute("data-maximized");
  });

  it("keeps the most recently used window on top", async () => {
    stubLayout();
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Inbox" }));
    const archive = screen.getByRole("dialog", { name: "Archive" });
    const inbox = screen.getByRole("dialog", { name: "Inbox" });
    expect(Number(inbox.style.zIndex)).toBeGreaterThan(Number(archive.style.zIndex));
    fireEvent.pointerDown(archive);
    await waitFor(() => expect(Number(archive.style.zIndex)).toBeGreaterThan(Number(inbox.style.zIndex)));
  });

  it("remembers which window is minimized or closed across many open windows", async () => {
    stubLayout();
    const user = userEvent.setup();
    render(<Home />);
    const taskbar = () => within(screen.getByRole("contentinfo", { name: "Taskbar" }));
    for (const name of ["Archive", "Inbox", "Search"]) await user.click(screen.getByRole("button", { name }));

    await user.click(screen.getByRole("button", { name: "Minimize Archive" }));
    await user.click(screen.getByRole("button", { name: "Minimize Inbox" }));
    expect(taskbar().getByRole("button", { name: "Archive" })).toHaveAttribute("aria-pressed", "true");
    expect(taskbar().getByRole("button", { name: "Inbox" })).toHaveAttribute("aria-pressed", "true");
    expect(taskbar().getByRole("button", { name: "Search" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("dialog", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Inbox" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Search" })).toBeVisible();

    // A minimized window is still open, and restores on demand.
    await user.click(taskbar().getByRole("button", { name: "Inbox" }));
    expect(screen.getByRole("dialog", { name: "Inbox" })).toBeVisible();
    expect(taskbar().getByRole("button", { name: "Inbox" })).toHaveAttribute("aria-pressed", "false");
    expect(taskbar().getByRole("button", { name: "Archive" })).toHaveAttribute("aria-pressed", "true");

    // Closing the active window hands over to the next visible one, and closing
    // the last one leaves a clean desktop with no stale taskbar entries.
    await user.click(within(screen.getByRole("dialog", { name: "Inbox" })).getByRole("button", { name: "Close folder" }));
    expect(screen.queryByRole("dialog", { name: "Inbox" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Search" })).toBeVisible();
    await user.click(within(screen.getByRole("dialog", { name: "Search" })).getByRole("button", { name: "Close folder" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(taskbar().getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("dialog", { name: "Archive" })).toBeVisible();
    expect(taskbar().getByRole("button", { name: "Archive" })).toHaveAttribute("aria-pressed", "false");
  });

  it("focuses an existing window instead of opening a duplicate", async () => {
    stubLayout();
    const { user } = await openArchive();
    await user.click(screen.getByRole("button", { name: "Minimize Archive" }));
    await user.click(within(screen.getByRole("contentinfo", { name: "Taskbar" })).getByRole("button", { name: "Archive" }));
    expect(screen.getAllByRole("dialog", { name: "Archive" })).toHaveLength(1);
  });

  it("commits a drag once, on release", async () => {
    stubLayout();
    const { windowFrame } = await openArchive();
    const titlebar = screen.getByTestId("window-titlebar-archive");
    const start = frameOrigin(windowFrame);
    // Several moves inside one gesture: the DOM follows immediately, without a registry round trip.
    fireEvent.pointerDown(titlebar, { clientX: 10, clientY: 10, pointerId: 3 });
    const origin = frameOrigin(windowFrame);
    fireEvent.pointerMove(titlebar, { clientX: 60, clientY: 40, pointerId: 3 });
    expect(frameOrigin(windowFrame)).toEqual({ x: origin.x + 50, y: origin.y + 30 });
    fireEvent.pointerMove(titlebar, { clientX: 130, clientY: 70, pointerId: 3 });
    expect(frameOrigin(windowFrame)).toEqual({ x: origin.x + 120, y: origin.y + 60 });
    fireEvent.pointerUp(titlebar, { clientX: 130, clientY: 70, pointerId: 3 });
    // ...and the committed registry geometry matches the frame that was dragged.
    await waitFor(() => expect(frameOrigin(windowFrame)).toEqual({ x: start.x + 120, y: start.y + 60 }));
    expect(frameSize(windowFrame)).toEqual({ w: 520, h: 400 });
  });

  it("restores focus to the launching shortcut after closing", async () => {
    stubLayout();
    const user = userEvent.setup();
    render(<Home />);
    const shortcut = screen.getByRole("button", { name: "Archive" });
    await user.click(shortcut);
    await user.click(within(screen.getByRole("dialog", { name: "Archive" })).getByRole("button", { name: "Close folder" }));
    expect(screen.queryByRole("dialog", { name: "Archive" })).not.toBeInTheDocument();
    expect(shortcut).toHaveFocus();
  });
});
