/**
 * The correspondence store behind the mail client.
 *
 * This module owns the mailbox vocabulary, the preview fixture, and the pure
 * queries the client calls. It holds no React and no presentation, so folder
 * arithmetic, sorting, and find can be tested on their own.
 *
 * The fixture is illustrative preview content, not canon, and the client says so
 * where it matters. Senders are offices, never people: `PROJECT_CONTEXT.md` is
 * explicit that organizations are entities and that no user is a mailbox
 * correspondent. Addresses, message ids, and the return reasons are the
 * fiction's own bookkeeping.
 */

export type MailFolderId = "inbox" | "drafts" | "outbox" | "sent" | "deleted" | "dead";
export type MailImportance = "normal" | "high" | "low";

export type MailAddress = { name: string; address: string };

export type MailMessage = {
  /** Stable key, `MSG-0000`, so tests and sorting never depend on position. */
  id: string;
  folder: MailFolderId;
  from: MailAddress;
  to: readonly MailAddress[];
  subject: string;
  /** `YYYY-MM-DD HH:MM`, so string order is chronological order. */
  received: string;
  body: readonly string[];
  importance?: MailImportance;
  attachments?: readonly string[];
  /** The store still marks this message unread. */
  unread?: boolean;
  /** Why the relay returned the message. Dead letters only. */
  returned?: string;
};

/** The terminal's own mailbox. */
export const MAILBOX_ADDRESS: MailAddress = { name: "Analyst, Terminal 04", address: "analyst@circa.local" };

/**
 * The Outlook Bar entries, in reading order. Icons are the supplied Windows 98
 * artwork; no two folders share a bitmap, so the strip reads at a glance.
 */
export const MAIL_FOLDERS: readonly { id: MailFolderId; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "/icons/envelope_closed-0.png" },
  { id: "drafts", label: "Drafts", icon: "/icons/registration-0.png" },
  { id: "outbox", label: "Outbox", icon: "/icons/envelope_open_sheet-0.png" },
  { id: "sent", label: "Sent Items", icon: "/icons/message_file-0.png" },
  { id: "deleted", label: "Deleted Items", icon: "/icons/recycle_bin_empty-4.png" },
  { id: "dead", label: "Dead Letters", icon: "/icons/msg_error-0.png" },
];

const OFFICE = {
  desk: { name: "Front Desk", address: "desk@circa.local" },
  records: { name: "Records Office", address: "records@circa.local" },
  clearance: { name: "Clearance Board", address: "clearance@circa.local" },
  retention: { name: "Retention Office", address: "retention@circa.local" },
  postmaster: { name: "Postmaster", address: "postmaster@circa.local" },
  terminal: { name: "Terminal Services", address: "terminal@circa.local" },
  review: { name: "Incident Review", address: "review@circa.local" },
  courier: { name: "Courier Service", address: "courier@circa.local" },
} as const satisfies Record<string, MailAddress>;

const TO_ANALYST = [MAILBOX_ADDRESS];

const mail = (
  id: string,
  folder: MailFolderId,
  from: MailAddress,
  subject: string,
  received: string,
  body: readonly string[],
  extra: Partial<MailMessage> = {},
): MailMessage => ({ id, folder, from, to: TO_ANALYST, subject, received, body, ...extra });

/**
 * Twenty-two messages across the six folders, so every state the client can
 * show has real content: unread mail, queued mail, returned mail, drafts, and a
 * deleted folder that the retention policy will not empty.
 */
export const MAILBOX_FIXTURE: readonly MailMessage[] = [
  mail("MSG-0001", "inbox", OFFICE.records, "Record INC-00063 filed", "2003-02-11 09:14", [
    "Your filing for INC-00063 has been accepted. The entry is listed in the internal index from this morning.",
    "No corrective action is required. The page removed before binding is recorded as absent, which is what the index will say from now on.",
  ], { unread: true, importance: "high" }),
  mail("MSG-0002", "inbox", OFFICE.clearance, "Clearance renewal, Level 4", "2003-02-10 16:40", [
    "Your Level 4 clearance has been renewed for the current quarter. Level 5 material remains unavailable to this terminal.",
    "Requests for Level 5 material are logged whether or not they are granted.",
  ]),
  mail("MSG-0003", "inbox", OFFICE.retention, "Sealed body request: INC-00118", "2003-02-09 11:02", [
    "Your request for the body of INC-00118 was denied. The designation stays withheld at Level 5.",
    "You may request the body again after the next index rebuild. The rebuild is not scheduled.",
  ]),
  mail("MSG-0004", "inbox", OFFICE.postmaster, "Undeliverable: continuity branch", "2003-02-08 07:31", [
    "A message you filed to a continuity branch could not be delivered. No continuity by that name accepts correspondence from this terminal.",
    "The message is held in Dead Letters. It will not be returned to you.",
  ], { unread: true, importance: "high" }),
  mail("MSG-0005", "inbox", OFFICE.desk, "Shelf nine, unclaimed record", "2003-02-07 23:58", [
    "A record was left on shelf nine outside filing hours. It carries your terminal number on the slip and no other marking.",
    "It will be filed under your name on the fourth day unless claimed.",
  ], { unread: true, attachments: ["shelf-slip.tif"] }),
  mail("MSG-0006", "inbox", OFFICE.terminal, "Terminal audit scheduled", "2003-02-06 08:00", [
    "An audit of terminal 04 is scheduled for the current quarter. Nothing is required of you.",
    "The audit reads the terminal's own logs, including this mailbox.",
  ]),
  mail("MSG-0007", "inbox", OFFICE.review, "Continuity branch C2 contested", "2003-02-05 13:20", [
    "ORG-C-005102/C2 is contested. Both branches claim the earlier filings.",
    "Do not file against either branch until the claim is settled. A filing against a contested branch is filed against both.",
  ]),
  mail("MSG-0008", "inbox", OFFICE.records, "Corrective action deadline", "2003-02-04 10:05", [
    "A corrective action assigned to your desk is due in eleven days.",
    "The archive does not decide truth. It decides what is on file. File the record, or file the reason it is late.",
  ], { unread: true, importance: "high" }),
  mail("MSG-0009", "inbox", OFFICE.desk, "Do not reply to this message", "2003-02-03 09:00", [
    "Do not reply to this message. Replies are filed as new correspondence and read by the retention office.",
  ]),
  mail("MSG-0010", "inbox", OFFICE.records, "Organization dossier reopened", "2003-02-02 15:47", [
    "ORG-A-020748 was reopened for review. Its two continuities are unaffected.",
    "Recognition records naming the org remain valid while the review is open.",
  ]),
  mail("MSG-0011", "inbox", OFFICE.courier, "Inbound courier delayed", "2003-02-01 06:12", [
    "An inbound courier from an unlisted office is delayed at the boundary. It carries paper, not mail.",
    "You will be notified when it is cleared, or when it is returned.",
  ]),
  mail("MSG-0012", "inbox", OFFICE.retention, "Quarterly retention notice", "2003-01-31 12:00", [
    "Nothing filed this quarter will be destroyed. The retention schedule has no disposal line.",
    "Deleted items are retained with the rest, and are removed from the client only when the store is rebuilt.",
  ], { attachments: ["retention-2003-q1.pdf"] }),

  mail("MSG-0013", "sent", MAILBOX_ADDRESS, "RE: Record INC-00063 filed", "2003-02-11 09:40", [
    "Acknowledged. The page stub has been photographed and returned to the binding.",
    "Terminal 04.",
  ], { to: [OFFICE.records] }),
  mail("MSG-0014", "sent", MAILBOX_ADDRESS, "RE: Shelf nine, unclaimed record", "2003-02-08 00:15", [
    "The slip is not mine. My terminal number was copied from a filing receipt dated the 7th.",
    "Please check the shelf log for the fourth day.",
  ], { to: [OFFICE.desk] }),

  mail("MSG-0015", "drafts", MAILBOX_ADDRESS, "(no subject)", "2003-02-10 17:02", [
    "I would like to know who requested the same thing before me, and on which terminal. The form has a field for it and the field is empty.",
  ], { to: [OFFICE.clearance] }),
  mail("MSG-0016", "drafts", MAILBOX_ADDRESS, "RE: Continuity branch C2 contested", "2003-02-06 09:20", [
    "If both branches claim the earlier filings, then one of them is filing on behalf of a reader who",
  ], { to: [OFFICE.review] }),

  mail("MSG-0017", "outbox", MAILBOX_ADDRESS, "RE: Quarterly retention notice", "2003-02-01 12:30", [
    "Your notice says nothing is destroyed. Please confirm in writing what happens to a record when the last reader stops filing one.",
  ], { to: [OFFICE.retention] }),

  mail("MSG-0018", "deleted", OFFICE.terminal, "Mailbox quota", "2003-01-28 08:00", [
    "Your mailbox is within quota. No action is required.",
  ]),
  mail("MSG-0019", "deleted", OFFICE.records, "Duplicate receipt", "2003-01-27 09:15", [
    "This is a duplicate of a receipt already sent. It may be discarded.",
  ]),

  mail("MSG-0020", "dead", MAILBOX_ADDRESS, "Undeliverable: continuity branch", "2003-02-08 07:30", [
    "Your message was returned by the relay before it left the building.",
  ], {
    to: [{ name: "Continuity C2", address: "continuity.c2@circa.local" }],
    returned: "No continuity by that name accepts correspondence from this terminal.",
  }),
  mail("MSG-0021", "dead", MAILBOX_ADDRESS, "Undeliverable: address not in the directory", "2003-01-24 04:10", [
    "The relay found no office at the address you used.",
  ], {
    to: [{ name: "Unlisted", address: "unlisted@circa.local" }],
    returned: "The address is well formed. No office claims it.",
  }),
  mail("MSG-0022", "dead", MAILBOX_ADDRESS, "Returned: sender is not a filing office", "2003-01-20 02:00", [
    "This message was addressed to your own mailbox and returned by the relay.",
  ], {
    to: [MAILBOX_ADDRESS],
    returned: "Correspondence from this terminal must be filed through a desk or a records office.",
  }),
];

/** Folder icons, keyed for the Outlook Bar. */
export function folderIcon(folderId: MailFolderId): string {
  return MAIL_FOLDERS.find((folder) => folder.id === folderId)?.icon ?? "/icons/envelope_closed-0.png";
}

export function folderLabel(folderId: MailFolderId): string {
  return MAIL_FOLDERS.find((folder) => folder.id === folderId)?.label ?? folderId;
}

/** Every message in one folder, in store order. */
export function folderMessages(messages: readonly MailMessage[], folderId: MailFolderId): MailMessage[] {
  return messages.filter((message) => message.folder === folderId);
}

export function countInFolder(messages: readonly MailMessage[], folderId: MailFolderId): number {
  return folderMessages(messages, folderId).length;
}

/**
 * The starting read state: every message the store does not mark unread. Live
 * read state is a set of ids in the client, so opening a folder never rewrites
 * the fixture.
 */
export function readIds(messages: readonly MailMessage[]): Set<string> {
  return new Set(messages.filter((message) => message.unread !== true).map((message) => message.id));
}

export function isUnread(message: MailMessage, read: ReadonlySet<string>): boolean {
  return !read.has(message.id);
}

export function unreadCount(messages: readonly MailMessage[], read: ReadonlySet<string>): number {
  return messages.filter((message) => isUnread(message, read)).length;
}

export type MailSortColumn = "received" | "from" | "subject" | "importance";
export type MailSort = { column: MailSortColumn; direction: "asc" | "desc" };

/** Newest first, which is how a mailbox opens. */
export const DEFAULT_SORT: MailSort = { column: "received", direction: "desc" };

/** High importance is the largest value, so a descending sort shows it first. */
export function importanceRank(message: Pick<MailMessage, "importance">): number {
  if (message.importance === "high") return 3;
  if (message.importance === "low") return 1;
  return 2;
}

function sortValue(message: MailMessage, column: MailSortColumn): string | number {
  if (column === "importance") return importanceRank(message);
  if (column === "from") return message.from.name.toLowerCase();
  if (column === "subject") return message.subject.toLowerCase();
  return message.received;
}

/**
 * Sorts a folder. Ties fall back to newest first, then to store order, so the
 * list never reshuffles between renders that produce the same comparison.
 */
export function sortMessages(messages: readonly MailMessage[], sort: MailSort): MailMessage[] {
  const direction = sort.direction === "asc" ? 1 : -1;
  return messages
    .map((message, position) => ({ message, position }))
    .sort((a, b) => {
      const left = sortValue(a.message, sort.column);
      const right = sortValue(b.message, sort.column);
      const compare = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));
      return (compare * direction)
        || b.message.received.localeCompare(a.message.received)
        || a.position - b.position;
    })
    .map((entry) => entry.message);
}

/** Free-text find over the subject, the sender, and the body. */
export function findMessages(messages: readonly MailMessage[], query: string): MailMessage[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...messages];
  return messages.filter((message) => [
    message.subject,
    message.from.name,
    message.from.address,
    ...message.body,
  ].join(" ").toLowerCase().includes(needle));
}

/** `Name <address>` for the header block, or a plain note when there is none. */
export function messageRecipients(message: Pick<MailMessage, "to">): string {
  if (message.to.length === 0) return "(no recipient)";
  return message.to.map((address) => `${address.name} <${address.address}>`).join("; ");
}

/**
 * The stamp for a message the operator queues now.
 *
 * The mailbox is a fixed archive, so a message written today must not carry a
 * modern timestamp and sort above three years of correspondence. The store's own
 * clock is one minute after its newest message, which keeps the fiction straight
 * and still puts a new draft at the top of the Outbox.
 */
export function nextStamp(messages: readonly MailMessage[]): string {
  const epoch = "2003-01-01 00:00";
  const latest = messages.reduce((max, message) => (message.received > max ? message.received : max), "");
  if (!latest) return epoch;
  const [date, time] = latest.split(" ");
  const [hour, minute] = time.split(":").map(Number);
  const bumped = minute + 1;
  return `${date} ${String(hour + Math.floor(bumped / 60)).padStart(2, "0")}:${String(bumped % 60).padStart(2, "0")}`;
}

/** The one-line preview the list shows beside a subject. */
export function messagePreview(message: MailMessage): string {
  return message.body[0] ?? "";
}
