# Mail client

## Responsibility

The in-world mail client, opened from the **Inbox** desktop shortcut. It is a three-pane reader over the terminal's own correspondence store, modelled on the pre-ribbon Outlook: menu bar, toolbar, an Outlook Bar of folder buttons, a sortable message grid, and a reading pane with a composer in its place.

The fiction decides the interaction model, the same way it does in the archive browser. This terminal reads mail; it cannot send any. Nothing pretends otherwise:

| Affordance | Behaviour |
| --- | --- |
| Folders | Six, in the Outlook Bar and the Go menu: Inbox, Drafts, Outbox, Sent Items, Deleted Items, Dead Letters. Every one holds real messages. |
| Reading | Selecting a message opens it and marks it read, so the status bar's unread count follows the operator. |
| Sorting | Real, from the column headers, with the direction announced through `aria-sort`. |
| Find | Real; typing filters the current folder as it is entered. There is no `Find Now` because a button that changed nothing would be a lie. |
| New, Reply, Reply All, Forward | Real; each opens the composer with the recipient, the subject, and the original quoted. |
| **Send** | Queues the message in the **Outbox**, which is what the reference client did with mail it could not hand to a transport. |
| **Send and receive** | Reports that no correspondence transport is connected and how many messages are waiting, instead of faking a transfer. |
| **Empty Deleted Items** | Refused with a notice: the retention schedule has no disposal line, so the archive destroys nothing. |
| View → Show | All messages, or unread only. A message stays listed in the unread view while it is open, so marking it read does not pull the row out from under the pointer. |
| Outlook Bar group arrows | Real disabled controls. This mailbox is provisioned with one shortcut group, and saying so is better than faking a switcher. |

## Structure

- `mailbox-index.ts`: the folder and message vocabulary, the preview fixture, and every pure query (folder split, read state, unread counts, sorting, find, recipient formatting).
- `mail-chrome.tsx`: the menu bar, toolbar, Outlook Bar, find bar, and status bar.
- `message-list.tsx`: the message grid and its sortable headers.
- `message-view.tsx`: the reading pane, the composer, and the draft a reply or forward starts from.
- `mail-notice.tsx`: the retention refusal and the About box, over the shared [message box](../ui/message-box.tsx).
- `mail-window.tsx`: the store, the view over it, and the action set.
- `mail-identity.ts`: the in-world product name and window title, in their own module so the chrome and the notices do not import each other in a cycle.

## Visual contract

The same formula as the browser: steel furniture around a document surface. The menu bar, toolbar, Outlook Bar, find bar, and status bar are chrome; the message grid and the reading pane are documents.

**The viewer is white.** The reference client's preview pane was white, so `.mail-view` overrides the shared surface tokens: paper, raised panel, and sunken field become white and near-white and the ink darkens to match. The message list above it keeps the shared grey-blue paper, and the archive is untouched, because the override is scoped to the viewer. The composer lives in the same pane, so its fields are white wells too.

- **Three panes, one column of chrome.** The Outlook Bar is a fixed track beside a column that stacks the find bar, the grid, and the reading pane. The list keeps a floor height, so a short window squeezes the panes rather than the controls.
- **Every mark comes from the Windows 98 set.** Folders name their own bitmap, so no two share one; the read and unread marks in the list are Lucide hairlines, because a 12px bitmap loses the shape a hairline keeps.
- **Every navigation row is one width.** The folder buttons fill the Outlook Bar and their labels fill the button, so a label's length or line count can never decide where its icon sits; only the button's own height was uniform before, which left the icons drifting.
- **The glyph column is three fixed slots.** Importance, read state, and attachment each own a 15px slot, so the marks line up down the list the way the reference's icon columns did; a single flex row of glyphs left them ragged.
- **Rows are uniform.** Every folder button has one height, so the icons and labels form a column instead of drifting with each label's line count.
- **State is never colour alone.** Unread mail is bold with a closed envelope against the read row's open one; the selected row is filled and carries a spine; the importance mark is a glyph, not a tint.
- **Status bar** reports the view's own totals (`12 items, 4 unread`), then the last action, then the store state and clearance.
- **Reflow.** Below 640px the tool labels drop to icons (the accessible name lives on `aria-label`) and the Outlook Bar narrows to its icons; below 460px it narrows again. The date column is never dropped: the pane scrolls sideways instead.

## Data and honesty

The fixture is twenty-three messages across the six folders, and it is illustrative preview content rather than canon. Senders are **offices, never people**: `PROJECT_CONTEXT.md` is explicit that organizations are entities and that no user is a mailbox correspondent, so every message comes from a desk, a records office, a clearance board, a retention office, a postmaster, or a courier service. Incident and organization codes match the archive's own index, so the two applications describe one world.

`MSG-0000`, the Front Desk's orientation message, is the one message the fiction keeps forever. It declares `pinned` and `permanent` on `MailMessage`; neither is honoured yet, so the list sorts it by its date like any other message and `Delete` will move it. Until the store implements the two, the flags state the intent rather than the behaviour.

Nothing here reaches the network. There is no transfer to fail, so no loading or transport-error state exists; `Send and receive` reports the truth about a transport that is not connected, and queued mail keeps its place in the Outbox. A message queued now is stamped one minute after the newest message in the store (`nextStamp`), because the store's clock is the archive's, not the wall clock.

## Boundaries and verification

Reading, filing locally, and drafting. Delivery, accounts, attachments as files, calendar, contacts, and every other Outlook surface belong to the backend and later screens. The window carries no generic destination status strip: the client prints its own, and `WorkstationWindow` omits the frame strip when a destination passes a null status.

Run `bun run test` for the folder arithmetic, sorting, find, read state, queueing, and the retention refusal; `bun run lint` and `bun run typecheck` for the rest.
