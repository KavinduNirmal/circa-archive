"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_SORT,
  MAIL_FOLDERS,
  MAILBOX_ADDRESS,
  MAILBOX_FIXTURE,
  countInFolder,
  findMessages,
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
import {
  MailFindBar,
  MailFolders,
  MailMenu,
  MailStatus,
  MailToolbar,
  folderLabel,
  type MailActions,
  type MailView,
} from "./mail-chrome";
import { MessageList } from "./message-list";
import { ComposePane, ReadingEmpty, ReadingPane, draftFrom, type ComposeDraft, type ComposeKind } from "./message-view";
import { MailNotice, type MailNoticeKind } from "./mail-notice";
import "./mail.css";

/** How the status bar names the column a sort was applied to. */
const SORTABLE_KEYS: Record<MailSortColumn, string> = {
  importance: "sortByImportance",
  from: "sortByFrom",
  subject: "sortBySubject",
  received: "sortByReceived",
};

/** What the status bar reports after each composer is opened. */
const PREPARED_KEYS: Record<ComposeKind, string> = {
  new: "messageStarted",
  reply: "replyPrepared",
  "reply-all": "replyAllPrepared",
  forward: "forwardPrepared",
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
  const t = useTranslations("mail");
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
  const [report, setReport] = useState(() => t("ready", { count: MAILBOX_FIXTURE.length }));

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
  const counts = t("counts", { items: listed.length, unread: unreadListed });

  function showFolder(next: MailFolderId) {
    setFolderId(next);
    setSelectedId(null);
    setCompose(null);
    setQuery("");
    setReport(t("openedFolder", { folder: folderLabel(t, next) }));
  }

  function select(message: MailMessage) {
    setSelectedId(message.id);
    setCompose(null);
    setRead((current) => (current.has(message.id) ? current : new Set(current).add(message.id)));
    setReport(t("messageOpened", { subject: message.subject }));
  }

  function sortBy(column: MailSortColumn) {
    setSort((current) => current.column === column
      ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
      : { column, direction: column === "received" ? "desc" : "asc" });
    setReport(t("sortedBy", { column: t(SORTABLE_KEYS[column]) }));
  }

  function deleteSelected() {
    if (!selected) return;
    setMessages((current) => current.map((item) => (item.id === selected.id ? { ...item, folder: "deleted" } : item)));
    setSelectedId(null);
    setReport(t("movedToDeleted", { subject: selected.subject }));
  }

  function markSelected(isRead: boolean) {
    if (!selected) return;
    setRead((current) => {
      const next = new Set(current);
      if (isRead) next.add(selected.id);
      else next.delete(selected.id);
      return next;
    });
    setReport(isRead ? t("markedAsRead") : t("markedAsUnread"));
  }

  function markAllRead() {
    setRead(new Set(messages.map((item) => item.id)));
    setReport(t("markedFolderRead", { folder: folderLabel(t, folderId) }));
  }

  function sendReceive() {
    const waiting = countInFolder(messages, "outbox");
    setReport(waiting === 0 ? t("transportIdle") : t("transportBlocked", { count: waiting }));
  }

  function startCompose(kind: ComposeKind) {
    setCompose(draftFrom(kind, selected, t));
    setReport(t(PREPARED_KEYS[kind]));
  }

  function sendDraft() {
    if (!compose) return;
    const recipient = compose.to.trim();
    if (!recipient) {
      setReport(t("needsRecipient"));
      return;
    }
    const id = `MSG-${String(messages.length + 1).padStart(4, "0")}`;
    const queued: MailMessage = {
      id,
      folder: "outbox",
      from: MAILBOX_ADDRESS,
      to: [{ name: recipient, address: recipient }],
      subject: compose.subject.trim() || t("noSubject"),
      received: nextStamp(messages),
      body: compose.body.trim() ? compose.body.split(/\n{2,}/) : [""],
    };
    setMessages((current) => [...current, queued]);
    setRead((current) => new Set(current).add(id));
    setCompose(null);
    setReport(t("queuedInOutbox", { subject: queued.subject }));
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
      setReport(next === "unread" ? t("showingUnread") : t("showingAll"));
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
                setReport(t("messageDiscarded"));
              }} />
              : selected
                ? <ReadingPane message={selected} />
                : <ReadingEmpty folderLabel={folderLabel(t, folderId)} items={listed.length} />}
          </div>
        </div>
      </div>
      <MailStatus counts={counts} report={report} />
      <MailNotice kind={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
