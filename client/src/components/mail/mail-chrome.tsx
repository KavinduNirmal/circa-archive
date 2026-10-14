"use client";

import { Forward, MailPlus, RefreshCw, Reply, ReplyAll, Search, Trash2 } from "lucide-react";
import { Menubar } from "radix-ui";
import { MAIL_FOLDERS, type MailFolderId } from "./mailbox-index";
import { MAIL_NAME } from "./mail-identity";

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

const KEY_REASON = "One shortcut group is provisioned on this mailbox";

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
  return (
    <Menubar.Root className="circa-menubar" aria-label="Mail menu">
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">File</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.newMessage}>
              New message<span className="circa-menukey">Ctrl+N</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.closeWindow}>Close window</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">Edit</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={() => actions.markSelected(true)}>
              Mark as read
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={() => actions.markSelected(false)}>
              Mark as unread
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.markAllRead}>Mark all as read</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.deleteSelected}>
              Delete<span className="circa-menukey">Ctrl+D</span>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">View</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.CheckboxItem className="circa-menuitem" checked={findOpen}
              onCheckedChange={(next) => actions.setFindOpen(next === true)}>
              Show find bar
            </Menubar.CheckboxItem>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Label className="circa-menulabel">Show</Menubar.Label>
            <Menubar.RadioGroup value={view} onValueChange={(next) => actions.setView(next as MailView)}>
              <Menubar.RadioItem className="circa-menuitem" value="all">All messages</Menubar.RadioItem>
              <Menubar.RadioItem className="circa-menuitem" value="unread">Unread messages</Menubar.RadioItem>
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">Go</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Label className="circa-menulabel">Folder</Menubar.Label>
            {MAIL_FOLDERS.map((folder) => (
              <Menubar.Item key={folder.id} className="circa-menuitem" onSelect={() => actions.goToFolder(folder.id)}>
                {folder.label}
                {folder.id === folderId && <span className="circa-menukey">current</span>}
              </Menubar.Item>
            ))}
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">Tools</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.sendReceive}>
              Send and receive<span className="circa-menukey">F5</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.emptyDeleted}>Empty Deleted Items</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">Actions</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.reply}>Reply</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.replyAll}>Reply all</Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!hasSelection} onSelect={actions.forward}>Forward</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">Help</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.about}>About {MAIL_NAME}</Menubar.Item>
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
  return (
    <div className="mail-toolbar" role="toolbar" aria-label="Mail actions">
      <MailTool label="New message" icon={MailPlus} onClick={actions.newMessage} />
      <MailTool label="Reply" icon={Reply} disabled={!hasSelection} onClick={actions.reply} />
      <MailTool label="Reply all" icon={ReplyAll} disabled={!hasSelection} onClick={actions.replyAll} />
      <MailTool label="Forward" icon={Forward} disabled={!hasSelection} onClick={actions.forward} />
      <MailTool label="Delete" icon={Trash2} disabled={!hasSelection} onClick={actions.deleteSelected} />
      <span className="mail-toolbar-divider" aria-hidden="true" />
      <MailTool label="Send and receive" icon={RefreshCw} onClick={actions.sendReceive} />
      <MailTool label="Find" icon={Search} pressed={findOpen} onClick={() => actions.setFindOpen(!findOpen)} />
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
  return (
    <div className="mail-outlookbar">
      <div className="mail-folder-group">
        <span className="mail-folder-group-label">Mailbox</span>
        <span className="mail-group-arrows">
          <button type="button" className="mail-group-arrow" disabled aria-label="Previous shortcut group" title={KEY_REASON}>▲</button>
          <button type="button" className="mail-group-arrow" disabled aria-label="Next shortcut group" title={KEY_REASON}>▼</button>
        </span>
      </div>
      <nav className="mail-folders" aria-label="Mailbox folders">
        {MAIL_FOLDERS.map((folder) => {
          const waiting = unread[folder.id];
          return (
            <button key={folder.id} type="button" className="mail-folder"
              aria-current={folder.id === folderId ? "page" : undefined}
              // The badge is part of the label, so the count is not only visible.
              aria-label={waiting > 0 ? `${folder.label}, ${waiting} unread` : folder.label}
              onClick={() => onSelect(folder.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mail-folder-icon" src={folder.icon} alt="" width={32} height={32} draggable={false} />
              <span className="mail-folder-label" aria-hidden="true">{folder.label}</span>
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
  return (
    <form className="mail-find" role="search" aria-label="Find messages"
      onSubmit={(event) => { event.preventDefault(); }}>
      <label className="mail-find-label" htmlFor="mail-find">Look for</label>
      <input id="mail-find" className="mail-find-input circa-sunken" type="text" autoComplete="off"
        value={query} onChange={(event) => onQueryChange(event.target.value)} />
      <button type="button" className="mail-find-button" onClick={onClear}>Clear</button>
    </form>
  );
}

/**
 * Status bar: what the view is listing, then the last action, then the store and
 * clearance cells. The counts describe exactly the rows on screen, so a find or
 * an unread filter reports its own totals.
 */
export function MailStatus({ counts, report }: { counts: string; report: string }) {
  return (
    <div className="mail-statusbar">
      <span className="mail-status-counts" data-testid="mail-counts">{counts}</span>
      <span className="mail-status-report" role="status">{report}</span>
      <span className="mail-status-cell">Local store, no transport</span>
      <span className="mail-status-cell">Level 4</span>
    </div>
  );
}
