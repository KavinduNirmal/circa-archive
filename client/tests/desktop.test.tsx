import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

function desktopIconIn(button: HTMLElement) {
  const icon = button.querySelector<HTMLElement>(".desktop-icon");
  if (!icon) throw new Error("shortcut is missing its icon");
  return icon;
}

describe("desktop navigation", () => {
  it("explains a desktop destination with the redesigned tooltip instead of a native title", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const organizations = screen.getByRole("button", { name: "Organizations" });
    expect(organizations).not.toHaveAttribute("title");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.hover(organizations);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Organization dossiers and continuities (coming soon)");
    expect(tooltip).toHaveClass("tooltip-content");
    expect(tooltip.querySelector(".tooltip-arrow")).not.toBeNull();
    // Pointer-leave tracking needs real pointer events, so dismissal is exercised with Escape.
    await user.keyboard("{Escape}");
    await waitFor(() => expect(tooltip).toHaveAttribute("data-state", "closed"));
  });

  it("keeps the Start menu free of redundant hints", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    const startNavigation = screen.getByRole("navigation", { name: "Start applications" });
    await user.hover(within(startNavigation).getByRole("button", { name: "Archive" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("maps each destination to its requested icon and shortcut marker", () => {
    render(<Home />);
    const navigation = screen.getByRole("navigation", { name: "Desktop folders" });
    const expected = {
      "My PC": { glyph: "my-pc", shortcut: false },
      Archive: { glyph: "archive", shortcut: true },
      Organizations: { glyph: "organizations", shortcut: false },
      "My Documents": { glyph: "records", shortcut: false },
      Inbox: { glyph: "inbox", shortcut: false },
      "CIRCA Word": { glyph: "circa-word", shortcut: false },
      Search: { glyph: "search", shortcut: false },
      _EXPUNGED: { glyph: "expunged", shortcut: true },
      "Recycle Bin": { glyph: "recycle", shortcut: false },
    } as const;
    for (const [label, { glyph, shortcut }] of Object.entries(expected)) {
      const icon = desktopIconIn(within(navigation).getByRole("button", { name: label }));
      expect(icon).toHaveAttribute("data-icon", glyph);
      expect(icon.getAttribute("data-shortcut")).toBe(shortcut ? "true" : null);
      expect(icon.querySelector(".desktop-icon-shortcut") !== null).toBe(shortcut);
    }
    expect(navigation.querySelectorAll("[data-shortcut]")).toHaveLength(2);
  });

  it("renders the supplied Windows 98 artwork for every destination", () => {
    render(<Home />);
    const navigation = screen.getByRole("navigation", { name: "Desktop folders" });
    const artwork: Record<string, string> = {
      "My PC": "/icons/computer-4.png",
      Archive: "/icons/directory_open_cabinet_fc-2.png",
      Organizations: "/icons/world-0.png",
      "My Documents": "/icons/directory_closed-0.png",
      Inbox: "/icons/envelope_closed-0.png",
      "CIRCA Word": "/icons/write_file-1.png",
      Search: "/icons/search_web-0.png",
      _EXPUNGED: "/icons/erase_file-0.png",
      "Recycle Bin": "/icons/recycle_bin_empty-4.png",
    };
    for (const [label, src] of Object.entries(artwork)) {
      const icon = desktopIconIn(within(navigation).getByRole("button", { name: label }));
      expect(icon.querySelector("img.desktop-icon-glyph")).toHaveAttribute("src", src);
    }
    expect(desktopIconIn(within(navigation).getByRole("button", { name: "Archive" })).querySelector("img.desktop-icon-shortcut"))
      .toHaveAttribute("src", "/icons/overlay_shortcut-2.png");
  });
  it("shows the help glyph inside the System window", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "My PC" }));
    await user.click(screen.getByRole("button", { name: "System" }));
    const systemWindow = screen.getByRole("dialog", { name: "System" });
    const icon = systemWindow.querySelector('[data-icon="help"] img');
    expect(icon).toHaveAttribute("src", "/icons/help_question_mark-0.png");
  });

  it("moves System into My PC and renames the editor", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.queryByRole("button", { name: "System" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "WRITE.exe" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CIRCA Word" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "My PC" }));
    await user.click(screen.getByRole("button", { name: "System" }));
    expect(screen.getByRole("dialog", { name: "System" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Back to My PC" }));
    expect(screen.getByRole("dialog", { name: "My PC" })).toBeVisible();
  });

  it("keeps Settings pinned left of the tray and the clock", () => {
    render(<Home />);
    const taskbar = screen.getByRole("contentinfo", { name: "Taskbar" });
    const settings = screen.getByRole("button", { name: "Settings" });
    expect(settings).toHaveClass("taskbar-task");
    expect(settings).toHaveTextContent("Settings");
    const notifications = screen.getByRole("button", { name: "Notifications" });
    const clock = taskbar.querySelector("time.workstation-clock");
    const spacer = taskbar.querySelector(".taskbar-spacer");
    if (!clock || !spacer) throw new Error("taskbar chrome is incomplete");
    const follows = (first: Element, second: Element) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    // Settings sits with the pinned task items, before the flexible gap that
    // pushes the tray and clock to the right edge.
    expect(follows(settings, spacer)).toBe(true);
    expect(follows(spacer, notifications)).toBe(true);
    expect(follows(notifications, clock)).toBe(true);
  });

  it("opens taskbar notifications and changes the screen setting", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Notifications are not connected yet.")).toBeVisible();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("checkbox", { name: "CRT screen filter" }));
    expect(screen.queryByTestId("screen-filter")).not.toBeInTheDocument();
  });
  it("opens a folder from the desktop and returns to the wallpaper", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const navigation = screen.getByRole("navigation", { name: "Desktop folders" });
    expect(navigation).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("dialog", { name: "Archive" })).toBeVisible();
    expect(screen.getByText("This folder is not connected yet.")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets an open overlay consume Escape before it closes the focused window", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("dialog", { name: "Archive" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start" }));
    // The launcher handles this press, so the focused window must survive it.
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Archive" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Archive" })).not.toBeInTheDocument();
  });

  it("opens and closes the start launcher", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("navigation", { name: "Start applications" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.queryByRole("navigation", { name: "Start applications" })).not.toBeInTheDocument();
  });
});
