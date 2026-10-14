import { describe, expect, it } from "vitest";
import {
  MAILBOX_FIXTURE,
  MAIL_FOLDERS,
  countInFolder,
  findMessages,
  folderMessages,
  importanceRank,
  messageRecipients,
  nextStamp,
  readIds,
  sortMessages,
  unreadCount,
  type MailMessage,
} from "@/components/mail/mailbox-index";

const message = (
  id: string,
  folder: MailMessage["folder"],
  from: string,
  subject: string,
  received: string,
  extra: Partial<MailMessage> = {},
): MailMessage => ({
  id,
  folder,
  from: { name: from, address: `${from.toLowerCase().replace(/ /g, ".")}@circa.local` },
  to: [{ name: "Analyst", address: "analyst@circa.local" }],
  subject,
  received,
  body: [`Body of ${subject}.`],
  ...extra,
});

const mailbox: readonly MailMessage[] = [
  message("MSG-0001", "inbox", "Records Office", "Record filed", "2003-02-11 09:14", { unread: true }),
  message("MSG-0002", "inbox", "Clearance Board", "Clearance renewed", "2003-02-10 16:40"),
  message("MSG-0003", "inbox", "Night Desk", "Shelf nine", "2003-02-07 23:58", { unread: true, importance: "high" }),
  message("MSG-0004", "deleted", "Terminal Services", "Mailbox quota", "2003-01-28 08:00"),
  message("MSG-0005", "dead", "Postmaster", "Undeliverable: no such continuity", "2003-01-24 04:10", { returned: "No office claims it." }),
];

describe("mailbox index", () => {
  it("splits the mailbox by folder", () => {
    expect(folderMessages(mailbox, "inbox").map((item) => item.id)).toEqual(["MSG-0001", "MSG-0002", "MSG-0003"]);
    expect(folderMessages(mailbox, "dead").map((item) => item.id)).toEqual(["MSG-0005"]);
    expect(folderMessages(mailbox, "outbox")).toEqual([]);
    expect(countInFolder(mailbox, "inbox")).toBe(3);
  });

  it("counts unread mail per folder and for the whole mailbox", () => {
    const read = readIds(mailbox);
    expect([...read].sort()).toEqual(["MSG-0002", "MSG-0004", "MSG-0005"]);
    expect(unreadCount(mailbox, read)).toBe(2);
    expect(unreadCount(folderMessages(mailbox, "inbox"), read)).toBe(2);
    expect(unreadCount(folderMessages(mailbox, "deleted"), read)).toBe(0);
  });

  it("orders results newest first, and by importance when asked", () => {
    expect(sortMessages(mailbox, { column: "received", direction: "desc" }).map((item) => item.id))
      .toEqual(["MSG-0001", "MSG-0002", "MSG-0003", "MSG-0004", "MSG-0005"]);
    expect(importanceRank({ importance: "high" })).toBeGreaterThan(importanceRank({ importance: "normal" }));
    expect(importanceRank({ importance: "low" })).toBeLessThan(importanceRank({ importance: "normal" }));
    expect(sortMessages(mailbox, { column: "importance", direction: "desc" })[0].id).toBe("MSG-0003");
    // Unread mail is filtered from the View menu, not sorted into its own column.
    expect(sortMessages(mailbox, { column: "importance", direction: "desc" }).at(-1)?.importance).toBeUndefined();
  });

  it("sorts by sender and subject in both directions", () => {
    expect(sortMessages(mailbox, { column: "from", direction: "asc" }).map((item) => item.from.name))
      .toEqual(["Clearance Board", "Night Desk", "Postmaster", "Records Office", "Terminal Services"]);
    expect(sortMessages(mailbox, { column: "subject", direction: "desc" })[0].subject).toBe("Undeliverable: no such continuity");
  });

  it("finds a message by subject, sender, or body", () => {
    expect(findMessages(mailbox, "shelf").map((item) => item.id)).toEqual(["MSG-0003"]);
    expect(findMessages(mailbox, "quota").map((item) => item.id)).toEqual(["MSG-0004"]);
    expect(findMessages(mailbox, "body of record filed").map((item) => item.id)).toEqual(["MSG-0001"]);
    expect(findMessages(mailbox, "  SHELF  ").map((item) => item.id)).toEqual(["MSG-0003"]);
    expect(findMessages(mailbox, "")).toHaveLength(mailbox.length);
    expect(findMessages(mailbox, "nothing here")).toEqual([]);
  });

  it("stamps a queued message on the store's own clock, not the wall clock", () => {
    // The mailbox is a 2003 archive, so a message written today must not carry
    // a modern timestamp and jump the whole folder.
    expect(nextStamp(mailbox)).toBe("2003-02-11 09:15");
    expect(nextStamp([...mailbox, message("MSG-0009", "sent", "Desk", "Later", "2003-02-11 10:59")])).toBe("2003-02-11 11:00");
    expect(nextStamp([])).toBe("2003-01-01 00:00");
  });

  it("formats recipients for the message header", () => {
    expect(messageRecipients(mailbox[0])).toBe("Analyst <analyst@circa.local>");
    expect(messageRecipients({ ...mailbox[0], to: [] })).toBe("(no recipient)");
  });

  it("ships a fixture that exercises every folder and state", () => {
    const folders = new Set(MAILBOX_FIXTURE.map((item) => item.folder));
    for (const folder of MAIL_FOLDERS) expect(folders.has(folder.id), folder.id).toBe(true);
    // The preview needs unread mail, queued mail, and returned mail to show its states.
    expect(MAILBOX_FIXTURE.filter((item) => item.unread === true).length).toBeGreaterThan(2);
    expect(MAILBOX_FIXTURE.filter((item) => item.folder === "outbox").length).toBeGreaterThan(0);
    expect(MAILBOX_FIXTURE.filter((item) => item.folder === "dead" && item.returned).length).toBeGreaterThan(1);
    for (const item of MAILBOX_FIXTURE) {
      expect(item.id, item.id).toMatch(/^MSG-\d{4}$/);
      expect(item.received, item.id).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(item.from.address, item.id).toMatch(/^[a-z.]+@circa\.local$/);
      expect(item.body.length, item.id).toBeGreaterThan(0);
      expect(item.subject.length, item.id).toBeGreaterThan(3);
    }
    // Folder icons are the supplied Windows 98 artwork, and no two folders share one.
    const icons = MAIL_FOLDERS.map((folder) => folder.icon);
    expect(new Set(icons).size).toBe(icons.length);
    for (const icon of icons) expect(icon).toMatch(/^\/icons\/[a-z0-9_\-]+\.png$/);
  });
});
