import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// The shell directly: the locale desktop route now posts first, and these tests are about the shell.
import { DesktopShell } from "@/components/desktop-shell";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { renderWorkstation } from "./intl";

/** The browser names its own window, so the frame and its taskbar entry read as the browser. */
const BROWSER_TITLE = "Titan Browser - CIRCA Archive";

/** Opens the Search destination, which hosts the archive browser. */
async function openBrowser(user: ReturnType<typeof userEvent.setup>) {
  renderWorkstation(<DesktopShell />);
  await user.click(screen.getByRole("button", { name: "Search" }));
  const frame = screen.getByRole("dialog", { name: BROWSER_TITLE });
  const status = () => within(frame).getByRole("status").textContent ?? "";
  return { frame, status };
}

async function submitQuery(
  user: ReturnType<typeof userEvent.setup>,
  frame: HTMLElement,
  text: string,
) {
  await user.clear(within(frame).getByLabelText("Search records"));
  if (text)
    await user.type(within(frame).getByLabelText("Search records"), text);
  await user.click(
    within(frame).getByRole("button", { name: "Search archive" }),
  );
}

describe("archive browser", () => {
  it("opens one pinned archive tab from the Search shortcut", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    // The frame is titled by the browser and drops the generic destination strip,
    // because the browser prints its own status bar along the bottom.
    expect(within(frame).getByText(BROWSER_TITLE)).toBeVisible();
    expect(frame.querySelector(".window-address")).toBeNull();
    const strip = within(frame).getByRole("tablist", { name: "Browser tabs" });
    const tabs = within(strip).getAllByRole("tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent("CIRCA Internal Archive");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    // The one reachable address is prefilled, and the field says why it is the only one.
    const address = within(frame).getByRole("textbox", { name: "Address" });
    expect(address).toHaveValue("http://archive.circa.local/index.htm");
    expect(address).toHaveAccessibleDescription(
      /assigned by the local network/i,
    );
  });

  it("searches the index and reports how many entries matched", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openBrowser(user);
    await submitQuery(user, frame, "freight");
    const table = within(frame).getByRole("table", { name: "Search results" });
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getByText("INC-00014")).toBeVisible();
    expect(status()).toMatch(`1 of ${ARCHIVE_INDEX.length} entries match`);
  });

  it("filters by class from the archive's own index links", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openBrowser(user);
    await user.click(
      within(frame).getByRole("button", { name: /incident index/i }),
    );
    const table = within(frame).getByRole("table", { name: "Search results" });
    expect(within(table).queryByText("ORG-C-005102")).not.toBeInTheDocument();
    expect(within(frame).getByLabelText("Class")).toHaveValue("incident");
    expect(status()).toMatch(/incident/i);
  });

  it("offers a real recovery when the filters exclude everything", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await user.selectOptions(
      within(frame).getByLabelText("Filed"),
      "historical",
    );
    await submitQuery(user, frame, "freight");
    expect(
      within(frame).getByRole("heading", { name: /no records match/i }),
    ).toBeVisible();
    await user.click(
      within(frame).getByRole("button", { name: "Search all periods" }),
    );
    expect(
      within(frame).getByRole("table", { name: "Search results" }),
    ).toHaveTextContent("INC-00014");
  });

  it("hands a record to the reader and leaves the result set behind it", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await submitQuery(user, frame, "freight");
    await user.click(within(frame).getByRole("button", { name: "INC-00014" }));
    // The record opens in the reader, which is the screen that reads one.
    const reader = screen.getByRole("dialog", { name: "Record Viewer" });
    expect(within(reader).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Unlogged freight car, northbound",
    );
    // The reader's own leaf carries the catalogue's line, clearance included.
    expect(reader.querySelector(".reader-leaf-line")).toHaveTextContent(
      "LEVEL 4",
    );
    expect(reader.querySelector(".reader-leaf-line")).toHaveTextContent(
      "Incident",
    );
    // The browser is still standing on the list the code came from.
    expect(
      within(frame).getByRole("table", { name: "Search results" }),
    ).toHaveTextContent("INC-00014");
    expect(within(frame).getByLabelText("Search records")).toHaveValue(
      "freight",
    );
    // The browser marks the code it has already opened, the way a visited link works.
    expect(
      within(frame).getByRole("button", { name: "INC-00014" }),
    ).toHaveAttribute("data-visited", "true");
  });

  it("leaves the index page to the index: a code never renders a record body here", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    // Opened from the index's own recently-filed list.
    await user.click(within(frame).getByRole("button", { name: "INC-00907" }));
    expect(within(frame).queryByRole("article")).not.toBeInTheDocument();
    expect(
      within(frame).getByRole("heading", { name: "Archive index" }),
    ).toBeVisible();
    expect(screen.getByRole("dialog", { name: "Record Viewer" })).toBeVisible();
  });

  it("gates Back and Forward on history and explains the idle Stop control", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    expect(within(frame).getByRole("button", { name: "Back" })).toBeDisabled();
    expect(
      within(frame).getByRole("button", { name: "Forward" }),
    ).toBeDisabled();
    expect(within(frame).getByRole("button", { name: "Stop" })).toBeDisabled();
    expect(within(frame).getByRole("button", { name: "Stop" })).toHaveAttribute(
      "title",
      "No transfer in progress",
    );
    await submitQuery(user, frame, "freight");
    expect(within(frame).getByRole("button", { name: "Back" })).toBeEnabled();
    await user.click(within(frame).getByRole("button", { name: "Back" }));
    expect(
      within(frame).getByRole("button", { name: "Forward" }),
    ).toBeEnabled();
  });

  it("refuses a new tab on the local network and keeps the single pinned tab", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openBrowser(user);
    await user.click(within(frame).getByRole("button", { name: "New tab" }));
    const notice = await screen.findByRole("alertdialog");
    expect(notice).toHaveTextContent(/not permitted on the local network/i);
    expect(notice).toHaveTextContent("LN-POLICY-07");
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(within(frame).getAllByRole("tab")).toHaveLength(1);
    expect(status()).toMatch(/refused/i);
  });

  it("reports the restricted local intranet zone in the status bar", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    expect(
      within(frame).getByText("Local intranet (restricted)"),
    ).toBeVisible();
    expect(within(frame).getByText("Clearance level 4")).toBeVisible();
  });

  it("reloads the current document and says so", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openBrowser(user);
    await user.click(within(frame).getByRole("button", { name: "Refresh" }));
    expect(status()).toMatch(/reloaded/i);
  });

  it("returns to the archive home from the pinned tab and from the toolbar", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await submitQuery(user, frame, "freight");
    await user.click(
      within(frame).getByRole("tab", { name: "CIRCA Internal Archive" }),
    );
    expect(
      within(frame).getByRole("heading", { name: "Archive index" }),
    ).toBeVisible();
    await submitQuery(user, frame, "freight");
    await user.click(within(frame).getByRole("button", { name: "Home" }));
    expect(
      within(frame).getByRole("heading", { name: "Archive index" }),
    ).toBeVisible();
  });

  it("changes the document text size from the View menu", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    expect(screen.getByTestId("archive-page")).toHaveAttribute(
      "data-text-size",
      "normal",
    );
    await user.click(within(frame).getByRole("menuitem", { name: "View" }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Large" }),
    );
    expect(screen.getByTestId("archive-page")).toHaveAttribute(
      "data-text-size",
      "large",
    );
  });

  it("explains why the address cannot be changed and why bookmarking is unavailable", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await user.click(
      within(frame).getByRole("menuitem", { name: "Bookmarks" }),
    );
    const item = await screen.findByRole("menuitem", { name: /add bookmark/i });
    expect(item).toHaveAttribute("data-disabled");
    await user.keyboard("{Escape}");
    const address = within(frame).getByRole("textbox", { name: "Address" });
    await user.clear(address);
    await user.type(address, "http://public.example.net");
    await user.click(within(frame).getByRole("button", { name: "Go" }));
    const notice = await screen.findByRole("alertdialog");
    expect(notice).toHaveTextContent(
      /address is assigned by the local network/i,
    );
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    // The refused address is taken back, so the bar never claims a host it cannot reach.
    expect(address).toHaveValue("http://archive.circa.local/index.htm");
  });

  it("shows an About box for the browser itself", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await user.click(within(frame).getByRole("menuitem", { name: "Help" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /about circa browser/i }),
    );
    const about = await screen.findByRole("alertdialog");
    expect(about).toHaveTextContent(/Titan Browser 4.12/);
    expect(about).toHaveTextContent(/Internal use only/i);
  });

  it("closes the browser window from the File menu", async () => {
    const user = userEvent.setup();
    const { frame } = await openBrowser(user);
    await user.click(within(frame).getByRole("menuitem", { name: "File" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /close window/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: BROWSER_TITLE }),
    ).not.toBeInTheDocument();
  });
});
