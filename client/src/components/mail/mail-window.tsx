"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SORT,
  MAIL_FOLDERS,
  MAILBOX_ADDRESS,
  MAILBOX_FIXTURE,
  countInFolder,
  findMessages,
  folderLabel,
  folderMessages,
  isUnread,
  nextStamp,
  readIds,
  sortMessages,
  unreadCount,
  type MailFolderId,
  type MailMessage,
  type MailSort,
  type MailSortColumn,
} from "./mailbox-index";
import { MailFindBar, MailFolders, MailMenu, MailStatus, MailToolbar, type MailActions, type MailView } from "./mail-chrome";
import { MessageList } from "./message-list";
import { ComposePane, ReadingEmpty, ReadingPane, draftFrom, type ComposeDraft, type ComposeKind } from "./message-view";
import { MailNotice, type MailNoticeKind } from "./mail-notice";
import "./mail.css";

const SORTABLE_TITLES: Record<MailSortColumn, string> = {
  importance: "importance",
  from: "sender",
  subject: "subject",
  received: "date received",
};

/**
 * The mail client, hosted by the Inbox destination.
 *
 * State is one store and one view over it: the messages, which of them have been
 * read, the current folder, the selected message, the sort, the find query, and
 * the open composer. Everything the status bar shows is derived from that, so
 * the counts can never disagree with the rows on screen.
 *
 * Nothing here pretends to have a network. Sending queues into the Outbox, the
 * way the reference client held mail it could not hand to a transport, and
 * Send/Receive reports that the transport is not connected instead of faking a
 * transfer.
 */
export function MailWindow({ onCloseWindow }: { onCloseWindow: () => void }) {
  const [messages, setMessages] = useState<readonly MailMessage[]>(MAILBOX_FIXTURE);
  const [read, setRead] = useState<ReadonlySet<string>>(() => readIds(MAILBOX_FIXTURE));
  const [folderId, setFolderId] = useState<MailFolderId>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<MailSort>(DEFAULT_SORT);
  const [view, setView] = useState<MailView>("all");
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [compose, setCompose] = useState<ComposeDraft | null>(null);
  const [notice, setNotice] = useState<MailNoticeKind | null>(null);
  const [report, setReport] = useState(`Ready. ${MAILBOX_FIXTURE.length} messages in the store.`);

  const selected = compose || !selectedId ? null : messages.find((item) => item.id === selectedId) ?? null;

  const unreadByFolder = useMemo(() => Object.fromEntries(
    MAIL_FOLDERS.map((folder) => [folder.id, unreadCount(folderMessages(messages, folder.id), read)]),
  ) as Record<MailFolderId, number>, [messages, read]);

  /** The rows the grid is showing, after the view filter, find, and sort. */
  const listed = useMemo(() => {
    let items = folderMessages(messages, folderId);
    // A message stays listed in the unread view while it is open, so marking it
    // read does not make the row vanish under the cursor.
    if (view === "unread") items = items.filter((item) => isUnread(item, read) || item.id === selectedId);
    return sortMessages(findMessages(items, query), sort);
  }, [messages, folderId, view, query, sort, read, selectedId]);

  const unreadListed = unreadCount(listed, read);
  const counts = `${listed.length} ${listed.length === 1 ? "item" : "items"}, ${unreadListed} unread`;

  function showFolder(next: MailFolderId) {
    setFolderId(next);
    setSelectedId(null);
    setCompose(null);
    setQuery("");
    setReport(`Opened ${folderLabel(next)}.`);
  }

  function select(message: MailMessage) {
    setSelectedId(message.id);
    setCompose(null);
    setRead((current) => (current.has(message.id) ? current : new Set(current).add(message.id)));
    setReport(`${message.subject} opened.`);
  }

  function sortBy(column: MailSortColumn) {
    setSort((current) => current.column === column
      ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
      : { column, direction: column === "received" ? "desc" : "asc" });
    setReport(`Sorted by ${SORTABLE_TITLES[column]}.`);
  }

  function deleteSelected() {
    if (!selected) return;
    setMessages((current) => current.map((item) => (item.id === selected.id ? { ...item, folder: "deleted" } : item)));
    setSelectedId(null);
    setReport(`${selected.subject} moved to Deleted Items.`);
  }

  function markSelected(isRead: boolean) {
    if (!selected) return;
    setRead((current) => {
      const next = new Set(current);
      if (isRead) next.add(selected.id);
      else next.delete(selected.id);
      return next;
    });
    setReport(isRead ? "Marked as read." : "Marked as unread.");
  }

  function markAllRead() {
    setRead(new Set(messages.map((item) => item.id)));
    setReport(`Marked ${folderLabel(folderId)} as read.`);
  }

  function sendReceive() {
    const waiting = countInFolder(messages, "outbox");
    setReport(waiting === 0
      ? "Send and receive: no correspondence transport is connected, and the Outbox is empty."
      : `Send and receive: no correspondence transport is connected, so ${waiting} message${waiting === 1 ? "" : "s"} cannot leave the Outbox.`);
  }

  function startCompose(kind: ComposeKind) {
    setCompose(draftFrom(kind, selected));
    setReport(kind === "new" ? "New message." : `${kind === "reply-all" ? "Reply all" : kind === "reply" ? "Reply" : "Forward"} prepared.`);
  }

  function sendDraft() {
    if (!compose) return;
    const recipient = compose.to.trim();
    if (!recipient) {
      setReport("This message needs a recipient before it can be queued.");
      return;
    }
    const id = `MSG-${String(messages.length + 1).padStart(4, "0")}`;
    const queued: MailMessage = {
      id,
      folder: "outbox",
      from: MAILBOX_ADDRESS,
      to: [{ name: recipient, address: recipient }],
      subject: compose.subject.trim() || "(no subject)",
      received: nextStamp(messages),
      body: compose.body.trim() ? compose.body.split(/\n{2,}/) : [""],
    };
    setMessages((current) => [...current, queued]);
    setRead((current) => new Set(current).add(id));
    setCompose(null);
    setReport(`${queued.subject} queued in the Outbox. No transport is connected.`);
  }

  const actions: MailActions = {
    newMessage: () => startCompose("new"),
    reply: () => startCompose("reply"),
    replyAll: () => startCompose("reply-all"),
    forward: () => startCompose("forward"),
    deleteSelected,
    markSelected,
    markAllRead,
    sendReceive,
    emptyDeleted: () => setNotice("retention"),
    setFindOpen,
    setView: (next) => {
      setView(next);
      setReport(next === "unread" ? "Showing unread messages." : "Showing all messages.");
    },
    goToFolder: showFolder,
    about: () => setNotice("about"),
    closeWindow: onCloseWindow,
  };

  return (
    <div className="mail">
      <MailMenu folderId={folderId} view={view} findOpen={findOpen} hasSelection={selected !== null} actions={actions} />
      <MailToolbar hasSelection={selected !== null} findOpen={findOpen} actions={actions} />
      <div className="mail-body">
        <MailFolders folderId={folderId} unread={unreadByFolder} onSelect={showFolder} />
        <div className="mail-main">
          {findOpen && <MailFindBar query={query} onQueryChange={setQuery} onClear={() => setQuery("")} />}
          <MessageList messages={listed} read={read} selectedId={selectedId} sort={sort}
            onSort={sortBy} onSelect={select} />
          <div className="mail-view">
            {compose
              ? <ComposePane draft={compose} onChange={setCompose} onSend={sendDraft} onDiscard={() => {
                setCompose(null);
                setReport("Message discarded.");
              }} />
              : selected
                ? <ReadingPane message={selected} />
                : <ReadingEmpty folderLabel={folderLabel(folderId)} items={listed.length} />}
          </div>
        </div>
      </div>
      <MailStatus counts={counts} report={report} />
      <MailNotice kind={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
