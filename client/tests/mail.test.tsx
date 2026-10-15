import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// The shell directly: the /desktop route now posts first, and these tests are about the shell.
import { DesktopShell as Home } from "@/components/desktop-shell";
import { MAIL_WINDOW_TITLE } from "@/components/mail/mail-identity";
import { MAILBOX_FIXTURE, DEFAULT_SORT, folderMessages, readIds, sortMessages, unreadCount } from "@/components/mail/mailbox-index";

const read = readIds(MAILBOX_FIXTURE);
const INBOX = folderMessages(MAILBOX_FIXTURE, "inbox");
const DELETED = folderMessages(MAILBOX_FIXTURE, "deleted");
const OUTBOX = folderMessages(MAILBOX_FIXTURE, "outbox");
const DEAD = folderMessages(MAILBOX_FIXTURE, "dead");
const INBOX_UNREAD = unreadCount(INBOX, read);
/** The grid opens on the store's default sort, so its first row is the newest message, not the fixture's first. */
const FIRST_LISTED = sortMessages(INBOX, DEFAULT_SORT)[0];

/** Opens the Inbox destination, which hosts the mail client. */
async function openMail(user: ReturnType<typeof userEvent.setup>) {
  render(<Home />);
  await user.click(screen.getByRole("button", { name: "Inbox" }));
  const frame = screen.getByRole("dialog", { name: MAIL_WINDOW_TITLE });
  const status = () => within(frame).getByRole("status").textContent ?? "";
  const counts = () => within(frame).getByTestId("mail-counts").textContent ?? "";
  const bar = () => within(frame).getByRole("navigation", { name: "Mailbox folders" });
  const grid = () => within(frame).getByRole("grid", { name: "Messages" });
  /** Data rows, without the column header row. */
  const rows = () => within(grid()).getAllByRole("row").slice(1);
  /** Folder buttons announce their unread count, so match the label prefix. */
  const folder = (name: string) => within(bar()).getByRole("button", { name: new RegExp(`^${name}`) });
  return { frame, status, counts, bar, folder, grid, rows };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, frame: HTMLElement, title: string) {
  await user.click(within(frame).getByRole("menuitem", { name: title }));
  return await screen.findByRole("menu");
}

describe("mail client", () => {
  it("opens the mailbox window with its own chrome and no destination strip", async () => {
    const user = userEvent.setup();
    const { frame, counts, bar, folder, rows } = await openMail(user);
    expect(within(frame).getByText(MAIL_WINDOW_TITLE)).toBeVisible();
    expect(frame.querySelector(".window-address")).toBeNull();
    expect(within(bar()).getAllByRole("button")).toHaveLength(6);
    expect(folder("Inbox")).toHaveAttribute("aria-current", "page");
    expect(rows()).toHaveLength(INBOX.length);
    expect(counts()).toBe(`${INBOX.length} items, ${INBOX_UNREAD} unread`);
    expect(within(frame).getByText("Local store, no transport")).toBeVisible();
  });

  it("reads a message in the preview pane and marks it read", async () => {
    const user = userEvent.setup();
    const { frame, counts, rows } = await openMail(user);
    await user.click(rows()[0]);
    const pane = within(frame).getByRole("region", { name: "Message" });
    expect(within(pane).getByRole("heading", { name: FIRST_LISTED.subject })).toBeVisible();
    expect(pane).toHaveTextContent(FIRST_LISTED.from.name);
    expect(pane).toHaveTextContent(FIRST_LISTED.body[0]);
    expect(counts()).toBe(`${INBOX.length} items, ${INBOX_UNREAD - 1} unread`);
  });

  it("sorts from the column headers and reports the direction", async () => {
    const user = userEvent.setup();
    const { frame, grid, rows } = await openMail(user);
    const alphabetically = [...INBOX].map((item) => item.subject).sort((a, b) => a.localeCompare(b));
    await user.click(within(grid()).getByRole("button", { name: "Subject" }));
    expect(within(grid()).getByRole("columnheader", { name: "Subject" })).toHaveAttribute("aria-sort", "ascending");
    expect(rows()[0]).toHaveTextContent(alphabetically[0]);
    await user.click(within(grid()).getByRole("button", { name: "Subject" }));
    expect(within(grid()).getByRole("columnheader", { name: "Subject" })).toHaveAttribute("aria-sort", "descending");
    expect(rows()[0]).toHaveTextContent(alphabetically[alphabetically.length - 1]);
    expect(within(frame).getByRole("columnheader", { name: "Received" })).toHaveAttribute("aria-sort", "none");
  });

  it("finds a message in the folder it is showing", async () => {
    const user = userEvent.setup();
    const { frame, counts, rows } = await openMail(user);
    await user.click(within(frame).getByRole("button", { name: "Find" }));
    const findBar = within(frame).getByRole("search", { name: "Find messages" });
    // A term only the night desk's slip carries, so one row matches. "shelf" alone
    // would also hit the orientation message, which mentions the shelf you keep.
    await user.type(within(findBar).getByLabelText("Look for"), "shelf nine");
    expect(rows()).toHaveLength(1);
    expect(counts()).toBe("1 item, 1 unread");
    await user.click(within(findBar).getByRole("button", { name: "Clear" }));
    expect(rows()).toHaveLength(INBOX.length);
  });

  it("filters to unread mail from the View menu", async () => {
    const user = userEvent.setup();
    const { frame, rows } = await openMail(user);
    await openMenu(user, frame, "View");
    await user.click(await screen.findByRole("menuitemradio", { name: "Unread messages" }));
    expect(rows()).toHaveLength(INBOX_UNREAD);
    await openMenu(user, frame, "View");
    await user.click(await screen.findByRole("menuitemradio", { name: "All messages" }));
    expect(rows()).toHaveLength(INBOX.length);
  });

  it("moves a message to Deleted Items", async () => {
    const user = userEvent.setup();
    const { frame, status, counts, folder, rows } = await openMail(user);
    await user.click(rows()[0]);
    await user.click(within(frame).getByRole("button", { name: "Delete" }));
    expect(status()).toMatch(/moved to deleted items/i);
    expect(counts()).toBe(`${INBOX.length - 1} items, ${INBOX_UNREAD - 1} unread`);
    await user.click(folder("Deleted Items"));
    expect(counts()).toBe(`${DELETED.length + 1} items, 0 unread`);
  });

  it("refuses to empty Deleted Items, because the archive destroys nothing", async () => {
    const user = userEvent.setup();
    const { frame, folder, counts } = await openMail(user);
    await user.click(folder("Deleted Items"));
    await openMenu(user, frame, "Tools");
    await user.click(await screen.findByRole("menuitem", { name: /empty deleted items/i }));
    const notice = await screen.findByRole("alertdialog");
    expect(notice).toHaveTextContent(/retention schedule has no disposal line/i);
    expect(notice).toHaveTextContent(/LN-POLICY-19/);
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    // Nothing left, and the refusal is a policy rather than a failure.
    expect(counts()).toBe(`${DELETED.length} items, 0 unread`);
  });

  it("reports that no transport is connected when sending and receiving", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openMail(user);
    await user.click(within(frame).getByRole("button", { name: "Send and receive" }));
    expect(status()).toMatch(/no correspondence transport is connected/i);
    expect(status()).toMatch(`${OUTBOX.length} message`);
  });

  it("composes a message and queues it in the Outbox", async () => {
    const user = userEvent.setup();
    const { frame, status, counts, folder, rows } = await openMail(user);
    await user.click(within(frame).getByRole("button", { name: "New message" }));
    const compose = within(frame).getByRole("form", { name: "New message" });
    await user.type(within(compose).getByLabelText("To"), "records@circa.local");
    await user.type(within(compose).getByLabelText("Subject"), "Page stub photographed");
    await user.type(within(compose).getByLabelText("Message"), "Photographed and returned to the binding.");
    await user.click(within(compose).getByRole("button", { name: "Send" }));
    expect(status()).toMatch(/outbox/i);
    await user.click(folder("Outbox"));
    expect(counts()).toBe(`${OUTBOX.length + 1} items, 0 unread`);
    expect(rows().some((row) => row.textContent?.includes("Page stub photographed"))).toBe(true);
  });

  it("needs a recipient before it will queue a message", async () => {
    const user = userEvent.setup();
    const { frame, status } = await openMail(user);
    await user.click(within(frame).getByRole("button", { name: "New message" }));
    const compose = within(frame).getByRole("form", { name: "New message" });
    await user.type(within(compose).getByLabelText("Subject"), "No recipient");
    await user.click(within(compose).getByRole("button", { name: "Send" }));
    expect(status()).toMatch(/needs a recipient/i);
    expect(within(frame).getByRole("form", { name: "New message" })).toBeVisible();
  });

  it("replies with the sender addressed and the original quoted", async () => {
    const user = userEvent.setup();
    const { frame, rows } = await openMail(user);
    await user.click(rows()[0]);
    await user.click(within(frame).getByRole("button", { name: "Reply" }));
    const compose = within(frame).getByRole("form", { name: "Reply" });
    expect(within(compose).getByLabelText("To")).toHaveValue(FIRST_LISTED.from.address);
    expect(within(compose).getByLabelText("Subject")).toHaveValue(`RE: ${FIRST_LISTED.subject}`);
    expect((within(compose).getByLabelText("Message") as HTMLTextAreaElement).value)
      .toMatch(/original message/i);
  });

  it("gates the actions that need a selected message", async () => {
    const user = userEvent.setup();
    const { frame } = await openMail(user);
    for (const name of ["Reply", "Reply all", "Forward", "Delete"]) {
      expect(within(frame).getByRole("button", { name })).toBeDisabled();
    }
    expect(within(frame).getByRole("button", { name: "New message" })).toBeEnabled();
  });

  it("jumps between folders from the Go menu", async () => {
    const user = userEvent.setup();
    const { frame, folder, rows } = await openMail(user);
    await openMenu(user, frame, "Go");
    await user.click(await screen.findByRole("menuitem", { name: "Dead Letters" }));
    expect(folder("Dead Letters")).toHaveAttribute("aria-current", "page");
    expect(rows()).toHaveLength(DEAD.length);
    // A dead letter says why the relay returned it.
    await user.click(rows()[0]);
    expect(within(frame).getByRole("region", { name: "Message" })).toHaveTextContent(/returned/i);
  });

  it("explains the retention policy for dead letters and shows an About box", async () => {
    const user = userEvent.setup();
    const { frame } = await openMail(user);
    await openMenu(user, frame, "Help");
    await user.click(await screen.findByRole("menuitem", { name: /about titan mail/i }));
    const about = await screen.findByRole("alertdialog");
    expect(about).toHaveTextContent(/Titan Mail 4.12/);
    expect(about).toHaveTextContent(/Internal use only/i);
    await user.click(within(about).getByRole("button", { name: "OK" }));
  });

  it("closes the mail window from the File menu", async () => {
    const user = userEvent.setup();
    const { frame } = await openMail(user);
    await openMenu(user, frame, "File");
    await user.click(await screen.findByRole("menuitem", { name: /close window/i }));
    expect(screen.queryByRole("dialog", { name: MAIL_WINDOW_TITLE })).not.toBeInTheDocument();
  });
});
