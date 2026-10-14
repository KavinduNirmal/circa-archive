import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { explorerTitle } from "@/components/files/files-identity";
import { FILE_TREE, nodeById } from "@/components/files/files-index";

/** The file browser is named for the folder it shows, so every folder window has its own title. */
const ARCHIVE_WINDOW_TITLE = explorerTitle("Archive");
const MY_PC_WINDOW_TITLE = explorerTitle("My Computer");

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
    expect(tooltip).toHaveTextContent("Organization dossiers and continuities");
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
      "My Work": { glyph: "records-work", shortcut: false },
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
      // The Inbox shortcut is the mail client's launcher, so it wears the app mark.
      Inbox: "/icons/outlook_express-1.png",
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
  it("shows the workstation root in My PC and keeps System off the desktop", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.queryByRole("button", { name: "System" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "WRITE.exe" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CIRCA Word" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "My PC" }));
    const myPc = screen.getByRole("dialog", { name: MY_PC_WINDOW_TITLE });
    // My PC lists the drive, and the drive's folders, in the file browser.
    // The drive and its folders are the listing, so the root reads like a disk.
    expect(nodeById("pc-drive", FILE_TREE)).toBeDefined();
    const tree = within(myPc).getByRole("tree", { name: "Folders" });
    // The root is open on arrival, so the drive's row is on screen immediately.
    expect(within(tree).getByText("C: [SYSTEM]")).toBeVisible();
    // The listing is the drive's contents, so the folders are rows with counts.
    // The name cell holds a focusable name control, so the listing is matched by
    // its rows rather than by the cells' own accessible names. The address bar's
    // place list also carries these labels, so the grid is the scope that matters.
    const listing = within(myPc).getByRole("grid", { name: "Files" });
    expect(within(listing).getByText("My Documents")).toBeVisible();
    expect(within(listing).getByText("System Files")).toBeVisible();
  });

  it("opens System from the folder tree and lists the workstation files", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "My PC" }));
    const myPc = screen.getByRole("dialog", { name: MY_PC_WINDOW_TITLE });
    // System lives inside My PC, so it is one tree row down from the root.
    const tree = within(myPc).getByRole("tree", { name: "Folders" });
    // The volume is open on mount, so System Files is already a row in the pane;
    // selecting it opens its own window at that folder.
    expect(within(tree).getByRole("button", { name: /^System Files/ })).toBeVisible();
    await user.click(within(tree).getByRole("button", { name: /^System Files/ }));
    /*
     * The window keeps the title it was opened with: the shell names a window
     * once, so a browser-style retitle per folder would need a registry write on
     * every navigation. The explorer still answers for where it now is, which is
     * what the address field and the pane report.
     */
    const system = screen.getByRole("dialog", { name: MY_PC_WINDOW_TITLE });
    expect(within(system).getByText("CIRCA_OS_MANUAL.pdf")).toBeVisible();
    expect(within(system).getByRole("button", { name: "Up one level" })).toBeVisible();
    expect((within(system).getByLabelText("Current path") as HTMLInputElement).value)
      .toBe("My Computer\\C: [SYSTEM]\\System Files");
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
    const archive = screen.getByRole("dialog", { name: ARCHIVE_WINDOW_TITLE });
    expect(archive).toBeVisible();
    // The eyebrow claim is honest: every desktop destination now opens a screen.
    expect(within(archive).getByRole("grid", { name: "Files" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets an open overlay consume Escape before it closes the focused window", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("dialog", { name: ARCHIVE_WINDOW_TITLE })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start" }));
    // The launcher handles this press, so the focused window must survive it.
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: ARCHIVE_WINDOW_TITLE })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: ARCHIVE_WINDOW_TITLE })).not.toBeInTheDocument();
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
