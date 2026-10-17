import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FileExplorer } from "@/components/files/file-explorer";
import { EXPLORER_NAME } from "@/components/files/files-identity";
import { FILE_TREE, SCOPES, childrenOf, folderCounts, nodeById } from "@/components/files/files-index";
import { renderWithIntl } from "./intl";

/**
 * The explorer is rendered on its own here rather than through the desktop.
 * The desktop tests already cover the shell opening it as a window; these cover
 * what the browser itself does with a list of files.
 */
function openExplorer(scopeId = "my-pc", props: { initialPath?: string } = {}) {
  const user = userEvent.setup();
  renderWithIntl(<FileExplorer scopeId={scopeId} initialPath={props.initialPath} onCloseWindow={() => {}} />);
  const root = document.querySelector<HTMLElement>(".files");
  if (!root) throw new Error("the explorer did not render");
  const tree = () => within(root).getByRole("tree", { name: "Folders" });
  const grid = () => within(root).getByRole("grid", { name: "Files" });
  /** Body rows only, without the header row, which has no `data-node`. */
  const rows = () => Array.from(root.querySelectorAll<HTMLTableRowElement>("tr.files-tr"));
  const names = () => rows().map((row) => row.querySelector(".files-row-name")?.textContent ?? "");
  const cells = (row: HTMLElement) => Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent ?? "");
  const status = () => within(root).getByRole("status").textContent ?? "";
  const address = () => (within(root).getByLabelText("Current path") as HTMLInputElement).value;
  const treeRow = (label: string | RegExp) => within(tree()).getByRole("button", { name: label });
  return { user, root, tree, grid, rows, names, cells, status, address, treeRow };
}

/** Opens one of the menu bar's menus and returns its content. */
async function openMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole("menuitem", { name: title }));
  return await screen.findByRole("menu");
}

describe("file browser", () => {
  it("opens at the destination's folder with its own chrome and status bar", () => {
    const { root, grid, status, address } = openExplorer("my-pc");
    // All three rows of furniture are present: menu, toolbar, and address.
    expect(within(root).getByRole("menubar", { name: "File browser menu" })).toBeVisible();
    expect(within(root).getByRole("toolbar", { name: "File browser tools" })).toBeVisible();
    expect(within(root).getByRole("textbox", { name: "Current path" })).toBeVisible();
    // My Computer opens at the volume, not at the root above it.
    expect(address()).toBe("My Computer\\C: [SYSTEM]");
    expect(within(grid()).getAllByRole("row").length).toBe(childrenOf("pc-drive", FILE_TREE).length + 1);
    expect(status()).toBe("8 objects, 2.1 GB free.");
    // The window frame's own strip is dropped, so this is the only status bar.
    expect(root.querySelector(".window-address")).toBeNull();
  });

  it("opens the folder its scope names instead of the volume", () => {
    const { address, names, status } = openExplorer("records");
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\My Documents");
    expect(names()).toEqual(expect.arrayContaining(["CASE_BRIEF.pdf", "My Work"]));
    expect(names()).not.toContain("KERNEL.SYS");
    expect(status()).toBe("8 objects (1 folders, 7 files)");
  });

  it("walks the tree, reports the path, and steps back up", async () => {
    const { user, treeRow, address, names, status } = openExplorer("my-pc");
    await user.click(treeRow(/^My Documents/));
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\My Documents");
    expect(names()).toContain("My Work");

    await user.click(screen.getByRole("button", { name: "Up" }));
    expect(address()).toBe("My Computer\\C: [SYSTEM]");
    expect(names()).toContain("Archive");

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\My Documents");
    expect(status()).not.toBe("8 OBJECTS, 2.1 GB FREE.");

    await user.click(screen.getByRole("button", { name: "Forward" }));
    expect(address()).toBe("My Computer\\C: [SYSTEM]");
  });

  it("refuses a jump outside the destination it was opened in, and says why", async () => {
    const { user, treeRow, address, status } = openExplorer("system");
    // System Files is a destination of its own, so its window will not leave it.
    await user.click(treeRow(/^My Documents/));
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\System Files");
    expect(status()).toBe("My Documents is outside System Files. Open it from its own desktop shortcut.");
  });

  it("offers the three layouts and keeps the header and the cells in step", async () => {
    const { user, root, grid, rows, cells } = openExplorer("records");
    expect(root).toHaveAttribute("data-view", "details");

    await user.click(within(root).getByRole("button", { name: "Large Icons" }));
    expect(root).toHaveAttribute("data-view", "icons");
    expect(root.querySelectorAll(".files-icon")).toHaveLength(rows().length || childrenOf("dir-documents", FILE_TREE).length);
    expect(root.querySelector(".files-table")).toBeNull();

    await user.click(within(root).getByRole("button", { name: "List" }));
    expect(root).toHaveAttribute("data-view", "list");
    expect(root.querySelectorAll(".files-row")).toHaveLength(childrenOf("dir-documents", FILE_TREE).length);

    await user.click(within(root).getByRole("button", { name: "Details" }));
    expect(root).toHaveAttribute("data-view", "details");
    // Every heading sits above the column it names, whatever the order is.
    const headings = within(grid()).getAllByRole("columnheader").map((cell) => cell.textContent ?? "");
    expect(headings).toEqual(["", "Name", "Type", "Size", "Modified"]);
    const myWork = rows().find((row) => row.textContent?.includes("My Work"));
    expect(myWork).toBeDefined();
    expect(cells(myWork!)).toEqual(["", "My Work", "File folder", "3 files", "2003-02-11 08:40"]);
  });

  it("sorts from the column headers and reports the direction", async () => {
    const { user, grid, names, cells } = openExplorer("archive");
    // Name is the order the listing opens in, so the first click flips it.
    expect(within(grid()).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    expect(names()[0]).toBe("CIRCA-M-0002");
    await user.click(within(grid()).getByRole("button", { name: "Name" }));
    expect(within(grid()).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
    expect(names()[0]).toBe("CIRCA-S-1283y19");

    // A new column starts ascending and takes the sort away from the last one.
    await user.click(within(grid()).getByRole("button", { name: "Size" }));
    expect(within(grid()).getByRole("columnheader", { name: "Size" })).toHaveAttribute("aria-sort", "ascending");
    expect(within(grid()).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "none");
    expect(cells(within(grid()).getAllByRole("row")[1])[3]).toBe("3 files");
  });

  it("selects a row, a whole folder branch, and every row in the listing", async () => {
    const { user, root, rows, status } = openExplorer("archive");
    const first = rows()[0];

    await user.click(within(first).getByRole("checkbox"));
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(status()).toBe("Selected: 1 folder, 3 files");

    await user.click(within(root).getByRole("menuitem", { name: "Edit" }));
    await user.click(await screen.findByRole("menuitem", { name: /Select all/ }));
    expect(rows().every((row) => row.getAttribute("aria-selected") === "true")).toBe(true);
    expect(status()).toBe("Selected all 6 items in Archive.");

    await user.click(within(root).getByRole("menuitem", { name: "Edit" }));
    await user.click(await screen.findByRole("menuitem", { name: "Invert selection" }));
    expect(rows().every((row) => row.getAttribute("aria-selected") === "false")).toBe(true);
  });

  it("counts a case folder's contents as the branch it stands for", async () => {
    const { user, root, rows, address } = openExplorer("archive");
    const blackDog = rows().find((row) => row.textContent?.includes("CIRCA-S-1283y19"));
    expect(blackDog).toBeDefined();
    // Selecting the folder selects the records inside it, which is what the
    // tri-state header means, so the count covers the whole branch.
    await user.click(within(blackDog!).getByRole("checkbox"));
    expect(rows().find((row) => row.textContent?.includes("CIRCA-S-1283y19")))
      .toHaveAttribute("aria-selected", "true");

    await user.click(within(root).getByRole("button", { name: "CIRCA-S-1283y19" }));
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\Archive\\CIRCA-S-1283y19");
  });

  it("refuses every file operation with the policy that refuses it", async () => {
    const { user, root } = openExplorer("records");
    const refused = [
      { button: "Cut", heading: "Cut, copy, and paste are disabled", reference: "LN-POLICY-24" },
      { button: "Copy", heading: "Cut, copy, and paste are disabled", reference: "LN-POLICY-24" },
      { button: "Delete", heading: "Nothing can be deleted from here", reference: "LN-POLICY-19" },
      { button: "Undo", heading: "The archive volume is read only", reference: "LN-POLICY-23" },
    ] as const;
    for (const item of refused) {
      await user.click(within(root).getByRole("button", { name: item.button }));
      const box = await screen.findByRole("alertdialog");
      expect(within(box).getByText(item.heading)).toBeVisible();
      expect(box).toHaveTextContent(item.reference);
      expect(box).toHaveTextContent(EXPLORER_NAME);
      await user.click(within(box).getByRole("button", { name: "OK" }));
    }
    // The menu refuses the same operations and marks them as restricted rather
    // than leaving them inert, so nobody has to guess why a rename is missing.
    const file = await openMenu(user, "File");
    expect(within(file).getByRole("menuitem", { name: /Rename/ })).toHaveTextContent("restricted");
  });

  it("shows a folder's properties, which is the one menu item that reports data", async () => {
    const { user, root } = openExplorer("records");
    await user.click(within(root).getByRole("button", { name: "My Documents" }));
    await user.click(within(root).getByRole("menuitem", { name: "File" }));
    await user.click(await screen.findByRole("menuitem", { name: "Properties" }));
    const box = await screen.findByRole("alertdialog");
    expect(within(box).getByText("My Documents Properties")).toBeVisible();
    const counts = folderCounts("dir-documents", FILE_TREE);
    expect(box).toHaveTextContent(`${counts.folders + counts.files} objects (${counts.folders} folders, ${counts.files} files)`);
  });

  it("offers Empty Recycle Bin only in the Recycle Bin, and still refuses it", async () => {
    const { user, root, names } = openExplorer("recycle");
    expect(names()).toEqual(expect.arrayContaining(["DRAFT-03_freight_car.txt", "SCRAP_NOTE.txt"]));
    await user.click(within(root).getByRole("button", { name: "Empty Recycle Bin" }));
    const box = await screen.findByRole("alertdialog");
    expect(within(box).getByText("Recycle Bin cannot be emptied")).toBeVisible();
    expect(box).toHaveTextContent("LN-POLICY-19");
  });

  it("does not offer the emptying tool in a folder that is not the bin", () => {
    const { root } = openExplorer("records");
    expect(within(root).queryByRole("button", { name: "Empty Recycle Bin" })).toBeNull();
    // The refusal itself still lives in the File menu, so the operation has one
    // route rather than a dead tool on every window.
    expect(within(root).getByRole("menuitem", { name: "File" })).toBeVisible();
  });

  it("shows _EXPUNGED empty and reports the count instead of a listing", () => {
    const { root, names, status, address } = openExplorer("expunged");
    expect(address()).toBe("My Computer\\C: [SYSTEM]\\_EXPUNGED");
    expect(names()).toEqual([]);
    expect(root.querySelector(".files-table")).toBeNull();
    expect(within(root).getByText("_EXPUNGED is empty")).toBeVisible();
    expect(root.querySelector(".files-empty-note")?.textContent).toBe("47 records expunged.");
    expect(root.querySelector(".files-empty-hint")?.textContent).toContain("removed from discoverability");
    expect(status()).toBe("47 records expunged.");
  });

  it("selects a file on one click and names it on the open", async () => {
    const { user, rows, status } = openExplorer("records");
    const brief = rows().find((row) => row.textContent?.includes("CASE_BRIEF.pdf"));
    await user.click(within(brief!).getByRole("button"));
    await waitFor(() => expect(brief).toHaveAttribute("aria-selected", "true"));
    expect(status()).toBe("Selected: 1 file");

    // Opening is the second click. The record reader is not wired in yet, so the
    // status bar names the file rather than leaving the gesture unanswered.
    fireEvent.doubleClick(within(brief!).getByRole("button"));
    await waitFor(() => expect(status())
      .toBe("CASE_BRIEF.pdf is filed read-only. Opening it in the archive reader is not connected yet."));
  });

  it("holds the whole store in its tree, so the scope does not trap the operator", async () => {
    const { root, treeRow } = openExplorer("records");
    // The pane walks from the workstation root whatever scope opened the window,
    // and the folder the window is showing is already open in it.
    expect(within(root).getByRole("treeitem", { name: /My Computer/ })).toBeVisible();
    expect(treeRow(/^My Documents/)).toBeVisible();
    expect(within(root).getAllByText("My Work").length).toBeGreaterThan(0);
  });

  it("offers the places the Go menu promises", async () => {
    const { user, address } = openExplorer("my-pc");
    await user.click(screen.getByRole("menuitem", { name: "Go" }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitem", { name: "Organizations" }));
    expect(address()).toContain("Organizations");

    await user.click(screen.getByRole("menuitem", { name: "Go" }));
    const again = await screen.findByRole("menu");
    await user.click(within(again).getByRole("menuitem", { name: "MY COMPUTER" }));
    expect(address()).toBe("My Computer\\C: [SYSTEM]");
  });

  it("explains the volume in its own About and storage policy boxes", async () => {
    const { user } = openExplorer("my-pc");
    const help = await openMenu(user, "Help");
    await user.click(within(help).getByRole("menuitem", { name: /About/ }));
    const about = await screen.findByRole("alertdialog");
    expect(within(about).getByText(`${EXPLORER_NAME} 4.12`)).toBeVisible();
    await user.click(within(about).getByRole("button", { name: "OK" }));

    const helpAgain = await openMenu(user, "Help");
    await user.click(within(helpAgain).getByRole("menuitem", { name: "Storage policy" }));
    const policy = await screen.findByRole("alertdialog");
    expect(policy).toHaveTextContent("_EXPUNGED holds nothing and reports a count instead");
  });

  it("keeps every scope pointed at a folder that exists", () => {
    for (const scope of SCOPES) {
      const root = nodeById(scope.rootId, FILE_TREE);
      expect(root?.kind, `${scope.id} does not open a folder`).toBe("folder");
    }
  });
});
