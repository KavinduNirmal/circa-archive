# File browser

## Responsibility

The workstation's file browser, opened by every folder destination on the desktop: **My PC**, **My Documents**, **My Work**, **Archive**, **Organizations**, **System Files**, the **Recycle Bin**, and **_EXPUNGED**. One component serves all of them, because a 1998 file manager does not change its behaviour when you double-click a different drive: a scope decides where the window opens and which mount it claims, and the navigation, listing, sorting, and selection behaviour are identical everywhere.

It exists so a folder can be used twice. The archive index is a browsable tree as well as a search form, the same records appear in My Documents and My Work, and every desktop container now opens a real screen instead of a placeholder pane.

## Structure

- `files-index.ts`: the virtual filesystem. A flat node table with `parent` pointers, the extension table, the scope list, and every pure helper (lookups, paths, sorting, selection, formatting). No React and no presentation, so the whole filesystem is testable without a renderer.
- `file-explorer.tsx`: the stateful browser: current folder, history cursor, view and sort, expanded tree, selection, notices, and the composition of the chrome plus the listing.
- `files-chrome.tsx`: the furniture: menu bar, icon toolbar, address row with the place list, the status bar, and the empty state.
- `folder-tree.tsx`: the tree pane, a real `tree` of `treeitem` rows with `aria-expanded` on every folder that has children.
- `file-list.tsx`: the three layouts. One column spec drives both the details header row and its body rows.
- `files-notice.tsx`: the refusals, the folder Properties sheet, and the About box as classic message boxes.
- `files-identity.ts`: the in-world product name and the per-folder window title helper.
- `files.css`: the Explorer chrome, the tree pane, the three listing layouts, and their container queries. Imported by `file-explorer.tsx`.

## The read-only fiction

The archive mount is read only, so the five file operations are present, correct, and refused with a named policy rather than hidden. A missing control is indistinguishable from a broken one; a refused control with a reference is a rule of the world.

| Operation | Refusal |
| --- | --- |
| New folder | `LN-POLICY-23 / FS_READ_ONLY_VOLUME`: folders are created by the filing service when a case is opened |
| Cut, Copy, Paste | `LN-POLICY-24 / FS_FILING_BY_SERVICE`: records are referenced by their case, not copied between folders |
| Delete, Empty Recycle Bin | `LN-POLICY-19 / FS_NO_DISPOSAL_LINE`: disposal is a scheduled act with a named officer; the retention schedule has no disposal line for this volume |
| Rename | `LN-POLICY-25 / FS_NAME_IS_KEY`: a record's name carries its case code and the index is keyed on that name |

Everything that is not a write is real. Navigation records history, Back and Forward replay it, Up respects the root, the tree pane walks the whole store, the columns sort, the rows and folder branches select, and the status bar reports exactly what happened including a jump the scope refused.

## Data model

One flat table of nodes with a `parent` pointer, not a nested tree. A folder therefore never owns its contents, which is what lets a document be filed once and appear twice: `wrk-brief` and `doc-brief` are two nodes for the same record in My Work and My Documents, so no view can drift from another by holding a stale copy.

The fixture follows the case rules in `ARCHITECTURE.md` §5.3: a case folder is named for its CIRCA code, nesting stops two levels inside it, evidence sits flat on the case root, and forks carry the `_F1` suffix in `Records/`. File-type artwork comes from the supplied 1998 icon set in `public/icons`.

Two deliberate departures from a literal Explorer, both because the fiction is stronger without them:

- **_EXPUNGED is empty and reports a count.** Expunged records are removed from discoverability, so there is no listing to open; the folder shows `47 records expunged.` and says why. This is the one scope whose empty state is a rule rather than an accident.
- **The window title is not retitled per folder.** The shell names a window once when it opens, so a browser-style retitle would need a registry write on every navigation. My Computer opens at `C:\` rather than at the root above it, which means the pane and the listing always agree about where the window is.

## Visual contract

The split is the same one the archive browser and the mail client use: everything outside the listing is workstation steel, and the listing is paper, because the files are the archive's content and not one more steel panel. The file-type bitmaps are drawn in full colour here rather than through the desktop's grey-blue filter, since the artwork is the only thing that distinguishes a record from a photograph once the names scroll off.

- **Composition.** Menu bar, icon toolbar with the view switch on the right, the address row, then the body as a tree pane and a listing, then a four-cell status bar. My Computer-style.
- **Details is the default.** The listing opens as a sortable four-column table (Name, Type, Size, Modified) with a checkbox per row, because the checkbox is what makes Select All and Invert selection mean something on a volume that refuses every write.
- **Type column is truthful.** A folder's size cell is not a size: it counts what the folder contains, and an empty one says `empty`.
- **Accessible roles are real.** The listing is a `grid` with sortable `columnheader`s carrying `aria-sort`, the pane is a `tree` with `aria-expanded`, and the status text is `role="status"`. The name cell holds a `span` with `role="button"` rather than a button element, because a button inside a table cell replaces the cell in the accessibility tree and the row would lose its name.
- **Reflow.** The browser is its own size container. Below 560px the tools drop to icons and the Type column is dropped; below 460px the tree pane goes, since it costs more than it gives at that width.

## Boundaries and verification

Browsing and selecting only. Opening a file in the archive reader is not connected yet, and the status bar says so by name rather than doing nothing; creating, filing, disposing of, and renaming records belong to the backend and the filing service. There is no transport and no write path, so no loading or error state exists.

Run `bun run test` for the filesystem helpers, the navigation contract, the three layouts, the sortable headers, the selection rules, every refusal, and the two empty states; `bun run lint` and `bun run typecheck` for the rest.
