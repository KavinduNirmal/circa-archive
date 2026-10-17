"use client";

import { useTranslations } from "next-intl";
import { Forward, MailPlus, RefreshCw, Reply, ReplyAll, Search, Trash2 } from "lucide-react";
import { Menubar } from "radix-ui";
import { MAIL_FOLDERS, type MailFolderId } from "./mailbox-index";
import { MAIL_NAME } from "./mail-identity";
import "../ui/menubar.css";

/** `unread` is a filter over the current folder, not a folder of its own. */
export type MailView = "all" | "unread";

/** Everything the chrome can ask the window to do. */
export type MailActions = {
  newMessage: () => void;
  reply: () => void;
  replyAll: () => void;
  forward: () => void;
  deleteSelected: () => void;
  markSelected: (read: boolean) => void;
  markAllRead: () => void;
  sendReceive: () => void;
  emptyDeleted: () => void;
  setFindOpen: (open: boolean) => void;
  setView: (view: MailView) => void;
  goToFolder: (folderId: MailFolderId) => void;
  about: () => void;
  closeWindow: () => void;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** The `mail` namespace key holding each folder's name. */
const FOLDER_KEYS: Record<MailFolderId, string> = {
  inbox: "folderInbox",
  drafts: "folderDrafts",
  outbox: "folderOutbox",
  sent: "folderSent",
  deleted: "folderDeleted",
  dead: "folderDead",
};

/**
 * A folder's name in the reader's language.
 *
 * Folder names are interface chrome, so they are not stored beside the message
 * fixture: one source per language, shared by the Outlook Bar, the Go menu, and
 * the window's status reports.
 */
export function folderLabel(t: Translate, folderId: MailFolderId): string {
  return t(FOLDER_KEYS[folderId]);
}

/**
 * The menu bar, in the order the reference client used it: File, Edit, View, Go,
 * Tools, Actions, Help. Every item acts, and the ones that cannot run without a
 * selected message are disabled rather than inert.
 */
export function MailMenu({ folderId, view, findOpen, hasSelection, actions }: {
  folderId: MailFolderId;
  view: MailView;
  findOpen: boolean;
  hasSelection: boolean;
  actions: MailActions;
}) {
  const t = useTranslations("mail");
  return (
    <Menubar.Root className="circa-menubar" aria-label={t("menuLabel")}>
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuFile")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.newMessage}>
              {t("newMessage")}<span className="circa-menukey">Ctrl+N</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.closeWindow}>{t("closeWindow")}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuEdit")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={() => actions.markSelected(true)}>
              {t("markAsRead")}
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={() => actions.markSelected(false)}>
              {t("markAsUnread")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.markAllRead}>{t("markAllAsRead")}</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.deleteSelected}>
              {t("delete")}<span className="circa-menukey">Ctrl+D</span>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuView")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.CheckboxItem className="circa-menuitem" checked={findOpen}
              onCheckedChange={(next) => actions.setFindOpen(next === true)}>
              {t("showFindBar")}
            </Menubar.CheckboxItem>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Label className="circa-menulabel">{t("showLabel")}</Menubar.Label>
            <Menubar.RadioGroup value={view} onValueChange={(next) => actions.setView(next as MailView)}>
              <Menubar.RadioItem className="circa-menuitem" value="all">{t("allMessages")}</Menubar.RadioItem>
              <Menubar.RadioItem className="circa-menuitem" value="unread">{t("unreadMessages")}</Menubar.RadioItem>
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuGo")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Label className="circa-menulabel">{t("folderHeading")}</Menubar.Label>
            {MAIL_FOLDERS.map((folder) => (
              <Menubar.Item key={folder.id} className="circa-menuitem" onSelect={() => actions.goToFolder(folder.id)}>
                {folderLabel(t, folder.id)}
                {folder.id === folderId && <span className="circa-menukey">{t("currentFolder")}</span>}
              </Menubar.Item>
            ))}
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuTools")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.sendReceive}>
              {t("sendAndReceive")}<span className="circa-menukey">F5</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.emptyDeleted}>{t("emptyDeletedItems")}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuActions")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.reply}>{t("reply")}</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.replyAll}>{t("replyAll")}</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.forward}>{t("forward")}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("menuHelp")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.about}>{t("aboutTitle", { name: MAIL_NAME })}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

/** Toolbar. Everything that needs a selected message says so by being disabled. */
export function MailToolbar({ hasSelection, findOpen, actions }: {
  hasSelection: boolean;
  findOpen: boolean;
  actions: MailActions;
}) {
  const t = useTranslations("mail");
  return (
    <div className="mail-toolbar" role="toolbar" aria-label={t("toolbarLabel")}>
      <MailTool label={t("newMessage")} icon={MailPlus} onClick={actions.newMessage} />
      <MailTool label={t("reply")} icon={Reply} disabled={!hasSelection} onClick={actions.reply} />
      <MailTool label={t("replyAll")} icon={ReplyAll} disabled={!hasSelection} onClick={actions.replyAll} />
      <MailTool label={t("forward")} icon={Forward} disabled={!hasSelection} onClick={actions.forward} />
      <MailTool label={t("delete")} icon={Trash2} disabled={!hasSelection} onClick={actions.deleteSelected} />
      <span className="mail-toolbar-divider" aria-hidden="true" />
      <MailTool label={t("sendAndReceive")} icon={RefreshCw} onClick={actions.sendReceive} />
      <MailTool label={t("find")} icon={Search} pressed={findOpen} onClick={() => actions.setFindOpen(!findOpen)} />
    </div>
  );
}

function MailTool({ label, icon: Icon, disabled, pressed, onClick }: {
  label: string;
  icon: typeof MailPlus;
  disabled?: boolean;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="mail-tool" aria-label={label} aria-pressed={pressed ? "true" : undefined}
      disabled={disabled} onClick={onClick}>
      <Icon className="mail-tool-glyph" aria-hidden="true" />
      <span className="mail-tool-label">{label}</span>
    </button>
  );
}

/**
 * The Outlook Bar: one column of large folder buttons over a group header. The
 * header carries the reference's group arrows as real disabled controls, because
 * this mailbox is provisioned with a single shortcut group and faking a switcher
 * would be worse than saying so.
 */
export function MailFolders({ folderId, unread, onSelect }: {
  folderId: MailFolderId;
  unread: Record<MailFolderId, number>;
  onSelect: (folderId: MailFolderId) => void;
}) {
  const t = useTranslations("mail");
  const reason = t("groupReason");
  return (
    <div className="mail-outlookbar">
      <div className="mail-folder-group">
        <span className="mail-folder-group-label">{t("mailboxGroup")}</span>
        <span className="mail-group-arrows">
          <button type="button" className="mail-group-arrow" disabled aria-label={t("previousGroup")} title={reason}>▲</button>
          <button type="button" className="mail-group-arrow" disabled aria-label={t("nextGroup")} title={reason}>▼</button>
        </span>
      </div>
      <nav className="mail-folders" aria-label={t("foldersLabel")}>
        {MAIL_FOLDERS.map((folder) => {
          const waiting = unread[folder.id];
          const label = folderLabel(t, folder.id);
          return (
            <button key={folder.id} type="button" className="mail-folder"
              aria-current={folder.id === folderId ? "page" : undefined}
              // The badge is part of the label, so the count is not only visible.
              aria-label={waiting > 0 ? t("unreadBadge", { label, count: waiting }) : label}
              onClick={() => onSelect(folder.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mail-folder-icon" src={folder.icon} alt="" width={32} height={32} draggable={false} />
              <span className="mail-folder-label" aria-hidden="true">{label}</span>
              {waiting > 0 && <span className="mail-folder-badge" aria-hidden="true">{waiting}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * The find bar. Typing filters the folder as it is entered, so there is no
 * `Find Now`: the reference needed one because its search was slow, and a button
 * that changes nothing here would be a lie.
 */
export function MailFindBar({ query, onQueryChange, onClear }: {
  query: string;
  onQueryChange: (next: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations("mail");
  return (
    <form className="mail-find" role="search" aria-label={t("findBarLabel")}
      onSubmit={(event) => { event.preventDefault(); }}>
      <label className="mail-find-label" htmlFor="mail-find">{t("lookFor")}</label>
      <input id="mail-find" className="mail-find-input circa-sunken" type="text" autoComplete="off"
        value={query} onChange={(event) => onQueryChange(event.target.value)} />
      <button type="button" className="mail-find-button" onClick={onClear}>{t("clear")}</button>
    </form>
  );
}

/**
 * Status bar: what the view is listing, then the last action, then the store and
 * clearance cells. The counts describe exactly the rows on screen, so a find or
 * an unread filter reports its own totals.
 */
export function MailStatus({ counts, report }: { counts: string; report: string }) {
  const t = useTranslations("mail");
  return (
    <div className="mail-statusbar">
      <span className="mail-status-counts" data-testid="mail-counts">{counts}</span>
      <span className="mail-status-report" role="status">{report}</span>
      <span className="mail-status-cell">{t("statusLocalStore")}</span>
      <span className="mail-status-cell">{t("statusLevel")}</span>
    </div>
  );
}
