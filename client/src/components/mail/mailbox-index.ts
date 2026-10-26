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

export type MailFolderId =
  "inbox" | "drafts" | "outbox" | "sent" | "deleted" | "dead";
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
  /** Orientation mail: held at the head of its folder whatever the sort. */
  pinned?: boolean;
  /** Retention never removes this message, so deleting it is refused. */
  permanent?: boolean;
  /** Why the relay returned the message. Dead letters only. */
  returned?: string;
};

/** The terminal's own mailbox. */
export const MAILBOX_ADDRESS: MailAddress = {
  name: "Analyst, Terminal 04",
  address: "analyst@circa.local",
};

/**
 * The Outlook Bar entries, in reading order. Icons are the supplied Windows 98
 * artwork; no two folders share a bitmap, so the strip reads at a glance.
 *
 * The folder *names* are not here. A folder's name is interface chrome, so it is
 * translated: the components read it from the `mail` namespace through
 * `folderLabel`, which keeps one source of truth for the label in each language.
 */
export const MAIL_FOLDERS: readonly { id: MailFolderId; icon: string }[] = [
  { id: "inbox", icon: "/icons/envelope_closed-0.png" },
  { id: "drafts", icon: "/icons/registration-0.png" },
  { id: "outbox", icon: "/icons/envelope_open_sheet-0.png" },
  { id: "sent", icon: "/icons/message_file-0.png" },
  { id: "deleted", icon: "/icons/recycle_bin_empty-4.png" },
  { id: "dead", icon: "/icons/msg_error-0.png" },
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
): MailMessage => ({
  id,
  folder,
  from,
  to: TO_ANALYST,
  subject,
  received,
  body,
  ...extra,
});

/**
 * Twenty-three messages across the six folders, so every state the client can
 * show has real content: unread mail, queued mail, returned mail, drafts, and a
 * deleted folder that the retention policy will not empty.
 */
export const MAILBOX_FIXTURE: readonly MailMessage[] = [
  // The Front Desk's orientation message: the one message the store keeps, and
  // the one the list should hold first. It is dated before the correspondence
  // that follows, because the terminal is assigned before it is used. The two
  // flags are declared here; the list and the delete action do not honour them
  // yet, so the message sits where its date puts it.
  mail(
    "MSG-0000",
    "inbox",
    OFFICE.desk,
    "Reviewer orientation",
    "2003-01-06 08:00",
    [
      "# Reviewer orientation",
      "",
      "You have been assigned a terminal. This message is a record of that assignment. It is also the only message in your inbox that will never be removed. Read it now, and read it again if you are unsure of procedure. Nothing here is confidential. Nothing here is optional.",
      "",
      "---",
      "",
      "## 1. What this is",
      "",
      "You are reading from a CIRCA/OS reviewer workstation. The Commission for Incident Review and Corrective Action maintains the archive you are about to browse. The Commission does not investigate. It does not intervene. It files.",
      "",
      "You are a **Reviewer**. A Reviewer is anyone who has found the archive and chosen to write. This is the only qualification. It is sufficient.",
      "",
      "There is no hierarchy among Reviewers. There is no administrator above you. There are only records, and the people who file them. You are one of the people who file them.",
      "",
      "---",
      "",
      "## 2. Your desktop",
      "",
      "Your workstation has eight icons. They are permanent. They are:",
      "",
      "- **Archive** — every incident ever filed. Browse by code, by name, or by organization. This is where you will spend most of your time.",
      "- **Organizations** — the dossiers. Every organization that has filed a record has a page here. The page is written by the community. It is not authoritative. It is what we have.",
      "- **Inbox** — where you are reading this. The inbox is where discovery happens. Records are filed in the Archive; discoveries arrive in the Inbox. File what you want to keep.",
      "- **My Records** — everything you have written. Drafts, filed records, adopted records, forked records. It is your shelf.",
      "- **CIRCA Word** — the editor. Use it to write.",
      "- **Search** — global search. Use it when you do not know a code.",
      "- **_EXPUNGED** — do not open this folder. It is empty. It is always empty. It is always there. The folder's properties will show a count. The count will not match what you see. This is correct.",
      "- **Recycle Bin** — your drafts, your deletions. Recoverable for thirty days. After thirty days, permanent. You will not be told which day your draft expires. Assume all of them.",
      "",
      "---",
      "",
      "## 3. Reading a record",
      "",
      "Open any record by double-clicking it. It will open in the **Record Viewer**, full screen. The Viewer has four regions:",
      "",
      "- **Left rail** — sections of the record. Click one to jump.",
      "- **Center** — the record itself. This is what you are here to read.",
      "- **Right rail** — annotations. These are comments. Anyone may file a note. Notes are anchored to sections, not to specific words. Do not attempt to anchor to a word; the tool does not support it.",
      "- **Footer** — subsequent records. This is how records connect. If a record cites another record, or if another record cites this one, the citation appears here. Follow them. This is how you find the ghost.",
      "",
      "The toolbar contains several controls. Some work. Some do not. `Rotate`, `Print`, and `Download` do not function. They have never functioned. Do not report this. It is not a bug.",
      "",
      "Zoom adjusts text size. Fit to margin adjusts width. `View` toggles between section views. These work.",
      "",
      "---",
      "",
      "## 4. Writing a record",
      "",
      "Open **CIRCA Word**. You will see a blank page and a dropdown.",
      "",
      "The dropdown asks which **incident** the record is about. Search by code (`INC-XXXXX`) or by name. If the incident exists, select it. If it does not exist, you are writing a new incident — select `New Incident` and the system will assign a code at filing.",
      "",
      "You will then choose a **type**:",
      "",
      "- **INCIDENT** — the original ghost story. The seed. Only the first filer can file this, and only once per incident. There are no rules yet. Write what happened.",
      "- **DISCOVERY** — how you or an organization found the incident. The first contact. This establishes primary claim by default.",
      "- **EXPLORATION** — everything after. Follow-ups, containment attempts, cross-references, contradictions, forks. The bulk of the archive lives here.",
      "- **RUMOR** — unverified claims, propaganda, scraps. Rumors attach to incidents or to organizations. Use them when you are not sure.",
      "",
      "You may also choose an **organization tag**. This is the lens your record is written through. Daydream Inc. calls incidents `Qterw`. The Bureau calls them `1793P-SYA`. CIRCA calls them `CIRCA-S` or `CIRCA-R` depending on filing status. You may file through any organization's lens, or none. If you file under none, the record receives a `CIRCA-R` code and is marked as unattributed.",
      "",
      "Your byline will be your username. Your flair — the badge on your profile — is personal and cosmetic. It will not appear on your records. Only your name will.",
      "",
      "---",
      "",
      "## 5. Codes and numbering",
      "",
      "Every incident has a code beginning `INC-`. Every record has a code beginning `CIRCA-`. Every organization has a code beginning `ORG-` once it is recognized.",
      "",
      "Codes are **permanent**. They are not reused. When a record is retired, its code becomes a gap in the index. Gaps are visible. Do not attempt to fill them.",
      "",
      "The earliest codes in the archive begin at `INC-01483`, not at `INC-00001`. This is not because earlier codes were removed. It is because the code system was introduced long after the archive already existed. The first records to receive codes were already late in the archive's history. The records that came before them have no codes. They are in the archive. They cannot be found by number.",
      "",
      "---",
      "",
      "## 6. Organizations",
      "",
      "Organizations are **not users**. They have no accounts. They cannot log in. They cannot be messaged. They exist only as records and dossiers.",
      "",
      "Anyone may file under any organization's lens. No user is authoritative over an organization. There are no owners, no handlers, no representatives. The organization's dossier is a wiki page that anyone may edit. Its voice is the aggregate of what has been written about it. It will be contradictory. This is expected.",
      "",
      "If you wish to create a new organization, you do not create one. You file a record that *mentions* an organization. The system will assign a provisional identifier (`CIRCA-ID-XXXX`). If enough records mention the same organization, it will be put to a vote. If the vote passes and the dossier is coherent, the organization is recognized and receives an `ORG-` code. If it fails, it is erased — but not deleted. Its records remain. They are marked as rumor. They may be reinstated later.",
      "",
      "Erased organizations are not gone. They are *filed as erased*. You may reference them. You may adopt their rumors. The archive does not forget.",
      "",
      "---",
      "",
      "## 7. Engagement",
      "",
      "Beneath every record, you will find four controls:",
      "",
      "- **Reviewer Assessment** — a five-point scale. Judge the record on craft, not on whether you believe it. `Marginal`, `Adequate`, `Sound`, `Exemplary`, or the neutral mark.",
      "- **Corroborate** — you agree with the record. A check.",
      "- **Contest** — you disagree with the record. A cross.",
      "- **Annotate** — open the right rail and file a note.",
      "",
      "Assessment and Corroborate/Contest are separate signals. A record may be well-written and contested, or poorly-written and corroborated. Do not confuse them.",
      "",
      "Ratings do not delete records. Nothing deletes records. Ratings affect sort order and discovery. That is all.",
      "",
      "---",
      "",
      "## 8. Rules",
      "",
      "There are two sets of rules. Learn the difference now.",
      "",
      "**Meta rules** apply to conduct on the platform. They are enforced by moderators. Violations are reported, reviewed, and the offending record is removed from discoverability. The author is notified. The reason is logged publicly in the quarterly moderation report. There is no appeal.",
      "",
      "Meta violations include: harassment of real persons, spam, plagiarism, illegal content, hate speech, and attempts to game the rating system.",
      "",
      "**In-world rules** do not exist. Propaganda against a fictional organization is not a violation. Contradicting another record is not a violation. Writing something uncomfortable, offensive, or wrong is not a violation. The archive files these things. The archive does not judge them.",
      "",
      "The distinction: harm to a real person is meta. Harm to a fictional entity is filed.",
      "",
      "If you believe a record violates a meta rule, report it. If you believe a record is merely wrong, annotate it. Do not report what you can annotate.",
      "",
      "---",
      "",
      "## 9. What we do not know",
      "",
      "We do not know why incidents occur. We do not know what they are. We do not know why some incidents attract records and others do not. We do not know when the Commission began, or why it continues.",
      "",
      "There is a hypothesis, filed under `CIRCA-R-000001`, that the Commission is itself an incident. This hypothesis is contested. It has not been adopted. It has not been rejected.",
      "",
      "It is on file because we file everything.",
      "",
      "---",
      "",
      "## 10. Welcome",
      "",
      "You have found the archive. You may have been led here. You may have arrived by accident. The distinction does not matter. The archive does not care how you arrived. It cares only what you file.",
      "",
      "You may write a record. You may write a hundred. You may write one and never return. All are acceptable. The archive does not require anything of you.",
      "",
      "But if you write, you become a Reviewer. And if you become a Reviewer, you become part of the record. And the record is permanent.",
      "",
      "Welcome to the Commission.",
      "",
      "We are glad you are here.",
      "",
      "We do not know why.",
      "",
      "---",
      "",
      "*Front Desk*  ",
      "*Commission for Incident Review and Corrective Action*  ",
      "*Permanence of record. Permanence of administration.*",
      "",
      "> **Notice:** This message is retained indefinitely. If you delete it, it will be re-filed under a new message number. The new message will contain the same text. The text may differ from this version in minor ways. This is not an error.",
    ],
    { unread: true, importance: "high", pinned: true, permanent: true },
  ),
  mail(
    "MSG-0001",
    "inbox",
    OFFICE.records,
    "Record INC-00063 filed",
    "2003-02-11 09:14",
    [
      "Your filing for INC-00063 has been accepted. The entry is listed in the internal index from this morning.",
      "No corrective action is required. The page removed before binding is recorded as absent, which is what the index will say from now on.",
    ],
    { unread: true, importance: "high" },
  ),
  mail(
    "MSG-0002",
    "inbox",
    OFFICE.clearance,
    "Clearance renewal, Level 4",
    "2003-02-10 16:40",
    [
      "Your Level 4 clearance has been renewed for the current quarter. Level 5 material remains unavailable to this terminal.",
      "Requests for Level 5 material are logged whether or not they are granted.",
    ],
  ),
  mail(
    "MSG-0003",
    "inbox",
    OFFICE.retention,
    "Sealed body request: INC-00118",
    "2003-02-09 11:02",
    [
      "Your request for the body of INC-00118 was denied. The designation stays withheld at Level 5.",
      "You may request the body again after the next index rebuild. The rebuild is not scheduled.",
    ],
  ),
  mail(
    "MSG-0004",
    "inbox",
    OFFICE.postmaster,
    "Undeliverable: unknown recipient",
    "2003-02-08 07:31",
    [
      "A message you filed to an address not in the directory could not be delivered. No office or body by that name accepts correspondence from this terminal.",
      "The message is held in Dead Letters. It will not be returned to you.",
    ],
    { unread: true, importance: "high" },
  ),
  mail(
    "MSG-0005",
    "inbox",
    OFFICE.desk,
    "Shelf nine, unclaimed record",
    "2003-02-07 23:58",
    [
      "A record was left on shelf nine outside filing hours. It carries your terminal number on the slip and no other marking.",
      "It will be filed under your name on the fourth day unless claimed.",
    ],
    { unread: true, attachments: ["shelf-slip.tif"] },
  ),
  mail(
    "MSG-0006",
    "inbox",
    OFFICE.terminal,
    "Terminal audit scheduled",
    "2003-02-06 08:00",
    [
      "An audit of terminal 04 is scheduled for the current quarter. Nothing is required of you.",
      "The audit reads the terminal's own logs, including this mailbox.",
    ],
  ),
  mail(
    "MSG-0007",
    "inbox",
    OFFICE.review,
    "Exploration EXP-288903 contested",
    "2003-02-05 13:20",
    [
      "EXP-288903 is contested. Its account of the tide interval disagrees with the gauge trace.",
      "Do not file against the exploration until the assessment is settled. A filing against a contested record is filed against the record as it stands.",
    ],
  ),
  mail(
    "MSG-0008",
    "inbox",
    OFFICE.records,
    "Corrective action deadline",
    "2003-02-04 10:05",
    [
      "A corrective action assigned to your desk is due in eleven days.",
      "The archive does not decide truth. It decides what is on file. File the record, or file the reason it is late.",
    ],
    { unread: true, importance: "high" },
  ),
  mail(
    "MSG-0009",
    "inbox",
    OFFICE.desk,
    "Do not reply to this message",
    "2003-02-03 09:00",
    [
      "Do not reply to this message. Replies are filed as new correspondence and read by the retention office.",
    ],
  ),
  mail(
    "MSG-0010",
    "inbox",
    OFFICE.records,
    "Organization dossier reopened",
    "2003-02-02 15:47",
    [
      "ORG-A-020748 was reopened for review. Its held filings are unaffected.",
      "Recognition records naming the org remain valid while the review is open.",
    ],
  ),
  mail(
    "MSG-0011",
    "inbox",
    OFFICE.courier,
    "Inbound courier delayed",
    "2003-02-01 06:12",
    [
      "An inbound courier from an unlisted office is delayed at the boundary. It carries paper, not mail.",
      "You will be notified when it is cleared, or when it is returned.",
    ],
  ),
  mail(
    "MSG-0012",
    "inbox",
    OFFICE.retention,
    "Quarterly retention notice",
    "2003-01-31 12:00",
    [
      "Nothing filed this quarter will be destroyed. The retention schedule has no disposal line.",
      "Deleted items are retained with the rest, and are removed from the client only when the store is rebuilt.",
    ],
    { attachments: ["retention-2003-q1.pdf"] },
  ),

  mail(
    "MSG-0013",
    "sent",
    MAILBOX_ADDRESS,
    "RE: Record INC-00063 filed",
    "2003-02-11 09:40",
    [
      "Acknowledged. The page stub has been photographed and returned to the binding.",
      "Terminal 04.",
    ],
    { to: [OFFICE.records] },
  ),
  mail(
    "MSG-0014",
    "sent",
    MAILBOX_ADDRESS,
    "RE: Shelf nine, unclaimed record",
    "2003-02-08 00:15",
    [
      "The slip is not mine. My terminal number was copied from a filing receipt dated the 7th.",
      "Please check the shelf log for the fourth day.",
    ],
    { to: [OFFICE.desk] },
  ),

  mail(
    "MSG-0015",
    "drafts",
    MAILBOX_ADDRESS,
    "(no subject)",
    "2003-02-10 17:02",
    [
      "I would like to know who requested the same thing before me, and on which terminal. The form has a field for it and the field is empty.",
    ],
    { to: [OFFICE.clearance] },
  ),
  mail(
    "MSG-0016",
    "drafts",
    MAILBOX_ADDRESS,
    "RE: Exploration EXP-288903 contested",
    "2003-02-06 09:20",
    [
      "If two explorations disagree about the same gauge, then one of them is filing on behalf of an observer who",
    ],
    { to: [OFFICE.review] },
  ),

  mail(
    "MSG-0017",
    "outbox",
    MAILBOX_ADDRESS,
    "RE: Quarterly retention notice",
    "2003-02-01 12:30",
    [
      "Your notice says nothing is destroyed. Please confirm in writing what happens to a record when the last reader stops filing one.",
    ],
    { to: [OFFICE.retention] },
  ),

  mail(
    "MSG-0018",
    "deleted",
    OFFICE.terminal,
    "Mailbox quota",
    "2003-01-28 08:00",
    ["Your mailbox is within quota. No action is required."],
  ),
  mail(
    "MSG-0019",
    "deleted",
    OFFICE.records,
    "Duplicate receipt",
    "2003-01-27 09:15",
    ["This is a duplicate of a receipt already sent. It may be discarded."],
  ),

  mail(
    "MSG-0020",
    "dead",
    MAILBOX_ADDRESS,
    "Undeliverable: unknown recipient",
    "2003-02-08 07:30",
    ["Your message was returned by the relay before it left the building."],
    {
      to: [{ name: "Unlisted office", address: "unlisted@circa.local" }],
      returned:
        "No office or body by that name accepts correspondence from this terminal.",
    },
  ),
  mail(
    "MSG-0021",
    "dead",
    MAILBOX_ADDRESS,
    "Undeliverable: address not in the directory",
    "2003-01-24 04:10",
    ["The relay found no office at the address you used."],
    {
      to: [{ name: "Unlisted", address: "unlisted@circa.local" }],
      returned: "The address is well formed. No office claims it.",
    },
  ),
  mail(
    "MSG-0022",
    "dead",
    MAILBOX_ADDRESS,
    "Returned: sender is not a filing office",
    "2003-01-20 02:00",
    [
      "This message was addressed to your own mailbox and returned by the relay.",
    ],
    {
      to: [MAILBOX_ADDRESS],
      returned:
        "Correspondence from this terminal must be filed through a desk or a records office.",
    },
  ),
];

/** Folder icons, keyed for the Outlook Bar. */
export function folderIcon(folderId: MailFolderId): string {
  return (
    MAIL_FOLDERS.find((folder) => folder.id === folderId)?.icon ??
    "/icons/envelope_closed-0.png"
  );
}

/** Every message in one folder, in store order. */
export function folderMessages(
  messages: readonly MailMessage[],
  folderId: MailFolderId,
): MailMessage[] {
  return messages.filter((message) => message.folder === folderId);
}

export function countInFolder(
  messages: readonly MailMessage[],
  folderId: MailFolderId,
): number {
  return folderMessages(messages, folderId).length;
}

/**
 * The starting read state: every message the store does not mark unread. Live
 * read state is a set of ids in the client, so opening a folder never rewrites
 * the fixture.
 */
export function readIds(messages: readonly MailMessage[]): Set<string> {
  return new Set(
    messages
      .filter((message) => message.unread !== true)
      .map((message) => message.id),
  );
}

export function isUnread(
  message: MailMessage,
  read: ReadonlySet<string>,
): boolean {
  return !read.has(message.id);
}

export function unreadCount(
  messages: readonly MailMessage[],
  read: ReadonlySet<string>,
): number {
  return messages.filter((message) => isUnread(message, read)).length;
}

export type MailSortColumn = "received" | "from" | "subject" | "importance";
export type MailSort = { column: MailSortColumn; direction: "asc" | "desc" };

/** Newest first, which is how a mailbox opens. */
export const DEFAULT_SORT: MailSort = { column: "received", direction: "desc" };

/** High importance is the largest value, so a descending sort shows it first. */
export function importanceRank(
  message: Pick<MailMessage, "importance">,
): number {
  if (message.importance === "high") return 3;
  if (message.importance === "low") return 1;
  return 2;
}

function sortValue(
  message: MailMessage,
  column: MailSortColumn,
): string | number {
  if (column === "importance") return importanceRank(message);
  if (column === "from") return message.from.name.toLowerCase();
  if (column === "subject") return message.subject.toLowerCase();
  return message.received;
}

/**
 * Sorts a folder. Ties fall back to newest first, then to store order, so the
 * list never reshuffles between renders that produce the same comparison.
 */
export function sortMessages(
  messages: readonly MailMessage[],
  sort: MailSort,
): MailMessage[] {
  const direction = sort.direction === "asc" ? 1 : -1;
  return messages
    .map((message, position) => ({ message, position }))
    .sort((a, b) => {
      const left = sortValue(a.message, sort.column);
      const right = sortValue(b.message, sort.column);
      const compare =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return (
        compare * direction ||
        b.message.received.localeCompare(a.message.received) ||
        a.position - b.position
      );
    })
    .map((entry) => entry.message);
}

/** Free-text find over the subject, the sender, and the body. */
export function findMessages(
  messages: readonly MailMessage[],
  query: string,
): MailMessage[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...messages];
  return messages.filter((message) =>
    [message.subject, message.from.name, message.from.address, ...message.body]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

/** `Name <address>` for the header block, or a plain note when there is none. */
export function messageRecipients(message: Pick<MailMessage, "to">): string {
  if (message.to.length === 0) return "(no recipient)";
  return message.to
    .map((address) => `${address.name} <${address.address}>`)
    .join("; ");
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
  const latest = messages.reduce(
    (max, message) => (message.received > max ? message.received : max),
    "",
  );
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
