# Record editor

## Responsibility

The Markdown editor behind the **CIRCA Word** desktop shortcut, styled as a 1999 word processor. It is the first half of the record-writing flow in `ARCHITECTURE.md` §5.6: the writing. The second half, filing, belongs to the filing service and is not built.

The scope is deliberately the markdown-specific tools, which is what the format bar is made of. There is no font box, no paragraph spacing, and no table-drawing widget, because none of those exist in the record format; a button that could not change the document would be decoration.

## Structure

- `document-model.ts`: the tool table and the pure edits. Every toolbar action is a function from text plus selection to new text plus new selection, and the statistics the status bar prints. No React, no DOM, so the entire editor behaviour is testable without a renderer.
- `editor-state.ts`: the reducer. Undo and redo history, the caret, the pressed tools, the address strip, and the view settings. Pure, with no refs and no timers.
- `word-chrome.tsx`: the furniture: the menu bar, the format bar, the ruler, and the status bar.
- `word-window.tsx`: the text area and event wiring. This is the only file that touches the DOM.
- `word-notice.tsx`: the refused filing and the About box, as classic message boxes.
- `word-identity.ts`: the in-world product name, the window title, and the text sizes.
- `word.css`: the format bar, the drawn ruler, the sheet on its desk, and the status bar. Imported by `word-window.tsx`.

## The tools

Sixteen buttons in two groups, each carrying the markdown it writes rather than a picture of the result. `B`, `I`, and `S` keep the word processor's own marks because those are the same in both languages; everything else prints its syntax, so the bar documents the format while it applies it. Each button's tooltip is the markdown it inserts, and each has the same fixed width, because a varying label like `{ }` would stagger the row.

| Group      | Tools                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| **Text**   | bold, italic, strikethrough, inline code, heading 1 to 3                                                    |
| **Blocks** | bulleted list, numbered list, blockquote, code block, link, image, table, horizontal rule, clear formatting |

Every one of them toggles. Inline markup wraps a selection and unwraps it again; a heading marker replaces whatever heading was there instead of stacking a second `#`; a list marker added to a line that already has one removes it. The style box is a real control rather than a readout: choosing a level is the same edit the H1 to H3 buttons make.

The toolbar also reports what the caret is inside. The pressed state reads the caret's line for the block markers, the run around the caret for the inline markers, and counts code fences above the caret for the code block, since no line inside a fence carries a marker of its own.

## Editing model

The document is the string in the text area, and the text area is controlled, so the string is the only place the text lives. Three rules do the work:

- **Undo is a stack of snapshots.** Keystrokes within `TYPING_WINDOW_MS` share one step, so Ctrl+Z removes the sentence you just typed; a pause, a paste, or a tool press starts a new one. `Ctrl+N` starts a new document and clears the history, and the text area is remounted at the same time so the browser's own undo stack cannot fight this one.
- **The selection is written back after every change.** A tool press moves focus to the button, and a caret that is not written back lands at the end of the document. The component reads the selection only from the events the text area fires, never from a timer.
- **The sheet grows.** The text area is measured and its height set from its own scroll height, so the page gets taller with the document rather than scrolling inside a fixed frame.

## Visual contract

The same split the browser, the mailbox, and the file browser use: the chrome is workstation steel and the sheet is paper. A format bar of dense 21px tools, a drawn ruler whose margins and inch scale are gradients rather than a draggable control, a white sheet on a grey desk with a rotated `UNFILED DRAFT` stamp, and a status bar of cells.

- **Type.** The document is monospace, because Markdown is being written and a proportional face would hide the markers the writer is responsible for. Prose set in caps is harder to read for no institutional gain, so the sheet is sentence case while every label around it is uppercase.
- **Status bar.** What the last action did, then `Page 1`, `Body Text`, the text size, and `Unfiled`. There is only ever one page, because the document is a Markdown draft rather than laid-out paper; the cell says so instead of inventing a page count.
- **Reflow.** The editor is its own size container. Below 620px the group legends drop and the sheet loses padding; below 460px the ruler goes, since it costs more than it gives at that width.

## Boundaries and verification

Writing only. Nothing leaves the terminal: there is no network call, no save path, and no filing. `File > Save`, `Open`, and `Print` are refused or disabled with the reason on the item, and `File > File to case` opens a notice naming the policy that withholds the filing key (`LN-POLICY-26`), because the case, organization, and type are chosen by that key rather than by the editor.

Run `bun run test` for the markdown edits, the undo rules, the pressed-state detection, the statistics, the address strip, and every refusal; `bun run lint` and `bun run typecheck` for the rest.
