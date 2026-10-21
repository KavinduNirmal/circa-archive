# Record reader

## Responsibility

The window that opens when a record is opened, from the archive index or from a follow-up filed against another record. It is the platform's primary reading surface, and it is styled as an off-brand PDF reader from the same era as the rest of the workstation: dense tool plates, a strip of page previews, a scale readout, marginalia, and a filing tray of subsequent records.

**It never renders a PDF.** There is no parser, no canvas, and no pagination. The window is a container: it frames a record and provides one slot for a body. Everything around the slot is the frame's; everything inside it belongs to whoever mounts a renderer.

That split is enforced, not just described. `RecordReader` renders each section as a named, empty anchor unless the host passes `renderSection`, and a test holds it to that. The desktop supplies `RecordFilingBody` from `record-filings.tsx`, which renders each section's Markdown through `record-markdown.tsx` and the shared pipeline in [`../../lib/markdown/`](../../lib/markdown/README.md). The renderer **filled the slot rather than replacing it**: `reader-window.tsx` was not touched by this work, and the prop at the one call site in `desktop-shell.tsx` is the same one it always was.

## Structure

- `reader-model.ts`: the vocabulary, the scale steps, the printed section numbers and anchors, and the pure text measurement. No React, no DOM. A section's body is Markdown, so the model holds only the structural blocks: the fields borrowed from the catalogue, and the withheld state.
- `record-sources.ts`: the filed bodies, as the CMS would hand them over — one Markdown document per record, plus `recordSections`, which splits a document at `##` alone.
- `ghost-story.ts`: the plan's test corpus, `CIRCA-S-03007`, bundled as a string. `public/Ghost_story.md` is the published copy and a test holds the two byte-identical.
- `record-filings.tsx`: the record service, stood in for. Builds a sectioned `RecordDocument` out of an index entry and its Markdown, and renders one section as the body the frame is handed.
- `record-markdown.tsx`: the viewer. The same remark plugin list the exports use, handed to `react-markdown`, plus the two handlers that turn a `redaction` and a `figure` into elements instead of the default `<div>`, and the document image component.
- `paper-redaction.tsx`: the redaction, held behind paper and opened on request, labelled either way.
- `paper-figure.tsx`: a figure with the alignment its directive asked for.
- `record-image.tsx`: a document photograph through `next/image`. The absolute URL is optimised against the hosts allowlisted in `next.config.ts`; a new image host must be added there.
- `reader-correspondence.ts`: the annotations filed against a record, the citations between records, and `explorationsFor`, the exploration filter over that citation web, all read from the archive index rather than restated.
- `record-updates.ts`: the filed status updates, one plain sentence per entry plus the day it was filed and the tone its card carries. It is data, not Markdown: nothing here runs through the renderer.
- `record-status-menu.tsx`: the two status-bar accounts — a count of updates and a count of explorations — and the popovers that open them. An exploration row uses the reader's record opener.
- `reader-session.ts`: the reviewer's session. Who is at the terminal, notes filed, endorsements, assessments, and votes, plus the merge that folds all of it into the margin for one record.
- `reader-chrome.tsx`: the toolbar and its two zones, the page-arrangement menu, and the credentials prompt.
- `reader-rails.tsx`: the left rail of section previews and the right rail of marginalia, with its composer.
- `reader-references.tsx`: the follow-up strip.
- `reader-window.tsx`: the composition, the view and scale state, the search pass, the status bar, and the body slot.
- `reader.css`: the frame's chrome, the sheet and its drawn printed edge, both rails, the follow-up strip, the status accounts, and the reader's one-shot motion. It also carries the registered `reader-match` search highlight, which cannot be scoped because the custom highlight API paints it by name. Imported by `reader-window.tsx`.

## The reader as a window

It opens **maximized, not fullscreen**: the taskbar stays, so the desktop metaphor survives and the frame still minimizes, restores, resizes, and closes like any other window. The frame drops its generic status strip because the reader prints its own.

`useWorkstationWindows().open` takes a `maximized` flag for this. That flag is only read when the window is created, so restoring a frame by hand is never undone by another open. Minimized windows are now hidden rather than unmounted, which is what lets the reader come back to the record and the scale it was left on; the same change is why the browser keeps its history across a trip to the taskbar.

The record trail lives in the shell, because the shell is what opens a record. A code clicked in the archive and a code clicked in a follow-up strip are the same event, so they take the same path and the viewer needs no effect to notice a new record.

## The frame's decisions

| Question                                 | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is a "page"?                        | A section. The body is Markdown and has no page boundaries, so auto-pagination would renumber itself on every resize. A record has sections, which is stable, cheap, and true to the archive.                                                                                                                                                                                                                                                                                      |
| What anchors a note?                     | A section, not a text selection. Text anchoring needs a stable reference model inside the renderer; a margin note hangs beside a page, not beside a word.                                                                                                                                                                                                                                                                                                                          |
| What is the sheet?                       | One continuous paper surface with a `68ch` measure, capped so a long line never arrives. No page borders and no per-page shadows.                                                                                                                                                                                                                                                                                                                                                  |
| What does the scale change?              | Type size, in tens from 80% to 160%, with a unitless line height so the leading follows. The measure is in `ch`, so the line stays the same length in characters at every scale.                                                                                                                                                                                                                                                                                                   |
| What sets the typeface?                  | The reader, from the Text menu: Courier (the default, because a record is a typed document), sans serif, serif, or the terminal's own mono. It is a reading preference rather than a property of the record, so switching records keeps it, and the machine values on the sheet — codes, field values, inline code — keep the terminal face whatever is chosen. The menu's sizes are presets over the same value the scale buttons step through: one number, two ways to reach it. |
| Where is the search read from?           | The sheet's own DOM, not the document model. The host's renderer may emit anything, so matches are found by walking what was rendered and painted with the custom highlight API, which never rewrites the renderer's output. The count is written into its own node by that effect rather than held in React state, because React cannot know it either.                                                                                                                           |
| How many follow-ups does the strip list? | Ten per direction, and it says how many it is holding back. A record can be cited hundreds of times and a reading surface is the wrong place to work through a hundred of anything, so the remainder are named in a message box and go no further. It is not a navigation: a hundred records belong in a file browser, and this screen is not one.                                                                                                                                 |

## Status accounts

A record's status updates and the explorations filed against it are accounts _of_
the record, not parts of its text, so neither enters the sheet. Each is a count in
the status bar: `3 updates` opens a popover of the filed sentences with their days,
and `1 exploration` opens the records that cite this one with the filing type
`EXPLORATION`. An exploration row calls the reader's own record opener, so it
opens as a record and not as a second reading surface. The public edition gives
the same update history its own sidebar section: a native accordion of coloured
cards, with the exploration count linked to the list route instead of opening a
panel.

The updates are plain sentences held in `record-updates.ts`; nothing parses them.
Exploration records do not carry status updates at all: the parent's count is the
account of them, and a test holds the fixture to that line. A cell is absent when
its count is zero, so a record with neither account has no extra chrome. The
popovers are Radix surfaces, which is what lets Escape close the panel before the
window handler sees the key and what returns focus to the count when it closes.

## Three controls that do nothing

**Rotate**, **Print**, and **Download** are shipped, styled identically to the working tools, focusable, and inert. They do not warn, they do not open a box, they do not disable themselves. This is a deliberate departure from the rule the rest of the workstation follows, where a control that cannot act says so on itself, and it is the one place in the shell where the software is older than its promises. Download is the single exception that states a reason, on its `title`, because a clearance refusal is something the institution would say out loud.

Everything else works: the three page arrangements, both scale buttons and the reset readout, fit to margin, search with its match count, the section rail, the annotation rail and its composer, endorsements, the assessment scale, corroboration and contest, the follow-up strip, and the trail's Back and Ahead.

## Engagement

Rating is quality; the vote is agreement. They are separate signals and are kept visually separate: the assessment is a five-point institutional scale (`—`, `Marginal`, `Adequate`, `Sound`, `Exemplary`) as a row of blocks in its own bordered group, while corroborate and contest are a check and a cross. A sound record can be contested, and the tests hold that line.

The assessment reads as one scale rather than five unrelated buttons: the blocks fill up to the grade reached, and the score beside them says how many points the record has been given. `—` is the absence of a judgement, so it is never part of the fill, and the top grade therefore lights four of the five blocks — which is why the score reads `N/5` and the highest reading is `4/5`. The score is printed rather than implied, so a value stepped to from somewhere else cannot leave the row looking blank.

A verdict is not a neutral press. Corroboration fills green and contest fills red at the same weight, because they are two readings of one record and neither is the resting state. The green is the palette's only one; the red is the hazard fill the rest of the system already uses. Both are press states on the same control rather than separate buttons, so the state is still carried by `aria-pressed` and not by colour alone.

All of it needs a reviewer session. A guest sees the controls, hovers them, and is asked once at a single modal with one line of text and one button reading `Enter`; the action that raised the prompt then completes. The assessment is a real radio group, so the scale keeps its arrow keys and one tab stop.

## Content, and how honest it is

`record-filings.tsx` follows two rules. A record's metadata is never restated: class, dates, holder, status, and clearance are read from the index entry, so the sheet cannot disagree with the catalogue. And a body is authored only for a record the preview has released; everything else renders the withheld shape, which is a real state of this screen. Five records carry a filed Markdown body and eighteen are reachable, so both states are one click apart.

The prose itself is Markdown, stored in `record-sources.ts` the way a CMS would store it, and rendered by the shared pipeline rather than by a second renderer kept in step by hand. The section heading belongs to the frame; the section's body is the renderer's. `CIRCA-S-03007` is the renderer's reference corpus, filed here so that the widest exercise of the renderer — a YAML header, a GFM table with redactions inside a cell, all three image alignments, a blockquote, a code block — is reachable by clicking rather than only by test. The browser cannot read `public/Ghost_story.md`, so `ghost-story.ts` carries it as data; run `bun run sync:corpus` after editing the published copy, and the byte-identity test fails if the two drift. It is the one record whose body disagrees with its own header (`status: FILED` against the printed `Status: OPEN`), which is left standing: the record is about records that contradict themselves, and silently reconciling it would destroy the point.

A citation card is the citing record's own index entry, not a second description of it. A note that names a section the record does not have is dropped rather than pinned to the wrong one. The follow-up types are exhaustive over the index, so a new record cannot silently default to being a discovery. The sheet carries the preview's honesty marker in its footer and the status bar repeats it.

## Redactions on the sheet

A redaction is a reader's affordance, not a secret. The withheld words are in the DOM so they can be opened, and are held behind the paper colour until the reader asks; `PaperRedaction` carries an accessible label and keeps the text `aria-hidden` until it is revealed, so a screen reader is told there is something to open rather than read the words aloud. Colour is never the only signal.

None of that reaches an export. `redactionMode` is owned by the pipeline, and `renderText` pins it to `hidden`, where the node has no children at all: a `.txt` record prints `[REDACTED]` and the withheld words are not in the string.

## The margin

A note folds to its head, and the head keeps what a folded note needs in order to still be a note: the writer, their number, and the day. The body, its actions, and its replies are `hidden` rather than restyled, so a folded margin keeps nothing in the accessibility tree that the reader cannot see; the nodes stay in the document so the fold control can go on naming the region it folds. A reply has no fold of its own — the note above it folds it.

A correspondent is a name and a number. The name is what they are called and the number is what they are filed under, which is what the archive cites when two correspondents share a name, so the code is printed under the name rather than instead of it. The numbers are stand-ins held in [`reader-identity.ts`](reader-identity.ts) until a directory is real; a note with no writer — an unattributed sheet, or correspondence that outlived the person who wrote it — prints no number rather than an invented one.

A note is written in a plain textarea, so it is read the way it was written: a blank line is a paragraph and a single line break stays a line break. The body is one element per paragraph and the stylesheet keeps the breaks inside them, because a long note joined into a single block is the one thing marginalia cannot survive.

The sheet's measure is set once, on the wrapper that holds the whole document. `ch` resolves against the font size of the element that uses it, so the same `68ch` written on the running head — which is set smaller — measures a narrower column and stops short of the text it belongs to. One wrapper, one width, and every child inherits it.

## The filing tray

Both rails can be put away, and so can the strip along the bottom, which is what a reader wants when the tray is longer than the document. Collapsing is structural rather than a style: the lists leave the DOM with the pixels, so nothing hidden is left in the accessibility tree, and the head still reports what is on file. The strip is `126px` open and one head row closed.

Each direction lists the ten most recently filed. Past that the group's head carries a control reading `N not shown`, and pressing it opens the in-world message box, which names the true count and says plainly that the remainder are on file but not listed here. That is the whole of it: no second window, no folder, no listing. The cap is the answer, not a limitation of it.

## Visual contract

Three materials, and the split is the argument of the screen. The chrome is the workstation's steel. The sheet is the brightest paper in the system, because it is the document itself rather than a page about one. The margin is cream, ruled, and dark-inked, with a red margin rule and a punched hole on each slip: it is the only warm surface in CIRCA/OS, and it is warm because marginalia is written on paper made for writing on.

- **Composition.** Toolbar across the top; section rail, sheet, and margin across the middle; follow-ups along the bottom; status bar last. The sheet loses width before it loses its measure.
- **Status accounts.** The update and exploration counts are status-bar cells, not sheet content: the bar's engraved divider, a hover fill, and a dark popover that opens upward. The update history is a stack of full-width cards whose left rule and ground carry the tone — steel for a filing, amber for a change, crimson for a claim — with the day in the terminal mono and the sentence in chrome type. Each exploration row is a full-width button with a pressed hover and a visible focus ring.
- **Toolbar.** Document actions left, engagement right, separated by engraved dividers. Tools are a glyph over an 8px label, or a glyph alone where the icon already says the word. The scale readout is a control, not a readout.
- **Hierarchy.** The leaf is the loudest thing on the sheet: code, designation at 1.8em, then one metadata line separated by hairlines rather than a table, because a table is what the record view this replaced used and a reader should read as a document header.
- **The withheld body.** Drawn as three redaction bars under a stamp, matching how the index draws a withheld name; the rail's preview for that section turns from paper to hazard. A redaction inside filed prose is the same idea at word scale: a bar, opened on request, never colour alone.
- **The rendered body.** Markdown is set as the sheet's own typography rather than as a web page: one measure, a section-opening line slightly larger than the rest, ruled tables, a hairline rule where the document has one, and figures that float at the alignment their directive asked for. Nothing here is a component the renderer chooses; it is the paper the renderer writes on.
- **Figures.** A record's figures are instant prints rather than plates: a white frame, a deep band under the photo carrying the caption, and a soft cast shadow that lifts the print off the sheet. The directive still decides the float and the width, and a full-width print clears the float before it, so a photograph can never sit on top of the one above it. A print whose evidence file is not on the desk keeps its frame, its caption, and the well where the photo would sit. The photograph itself is rendered through `next/image`, so the sheet and the public edition share one image pipeline; the pipeline does not know a document image's intrinsic size, so the figure reserves a 4:3 plate and the sheet restores the photograph's own ratio once it loads.
- **The classified sheet.** The sheet is one typewritten document: the record's own text is set in `Courier New` (with metric-compatible clones behind it), while the frame around it and the machine values inside it keep the workstation's sans and mono. Headings are set in caps from the markup's own casing, so an accessible name and a copied line keep the case they were written in. The code that names the record is the one red mark on the leaf, set in Redacted Crimson and larger than a label. A contested record's stamp carries a light fill; an ordinary filing is not stamped at all, and a sealed one keeps its bare border.
- **Drawn redactions.** Every drawn redaction is the same block at the same height: the three bars of a withheld body, the bar standing in for a withheld designation, and the inline mark.
- **Prose rules.** The body's rules restate what Tailwind's preflight resets. A reset written for chrome strips list markers and anchor decoration from a document that is meant to be read, so nested lists, link underlines, table rules, and code blocks are declared here rather than assumed, and a test holds the renderer to emitting the elements they style.
- **The printed edge.** The sheet is continuous stationery: a column of round tractor-feed holes runs down each side, with the perforation the strip tore along just inside it. It is drawn with backgrounds, so the edge belongs to the paper rather than to the record, and it pulls in with the padding on a narrow frame so a hole never lands on the text.
- **The running head and foot.** Whose filing this is, printed at the top and the bottom: the filing lens, paired with the record's code above and with the class and clearance below. Both read that lens from the index entry, like every other field on the sheet, and the preview's honesty marker sits after the foot as the screen's own note rather than the document's.
- **States.** A record at every status; a withheld body; a designation withheld; a code the index does not carry; no record open; an unannotated record; no follow-ups; a direction with nothing in it; a direction holding more than the strip will list; the tray put away. Every one of them is reachable, and none of them is a dead end.
- **Reflow.** Below 1024px both rails are strips by default and open as overlays rather than pushing the sheet; below 1100px two-up folds to one column; below 768px the follow-up groups stack and their cards stop pretending to be a filmstrip. The rail's collapse is the one place where the same breakpoint is declared twice, once in the container query that produces the default before hydration and once in the hook that decides what the first click means.

## Motion

Three one-shot glitches, all CSS, all with a hidden or settled base state, which is the entire reduced-motion story: declining to animate is enough.

1. The toolbar settles in a frame or two after the sheet.
2. The scale readout blips to `102%` and back.
3. The margin slips six pixels and settles.

The preview rail shows a section that is not in the record and then corrects itself, which is timed in a keyframe rather than in state so nothing has to remember that it happened. All four collapse under `prefers-reduced-motion`, and the sheet's smooth scrolling goes with them.

## Boundaries and verification

Reading, and only the record in front of it. Notes, endorsements, and votes are session state: they are not persisted, not authorized, and not sent anywhere, and the reviewer credential is a fixed handle rather than an authentication. Filing, rating aggregates, and backend persistence are not connected to the reader; the separate account service does not authenticate these local reader actions.

Run `bun run test` for the model, the filings, the record sources, the status accounts, the correspondence, the frame's slot, the three silent controls, the scale limits, the arrangements, the search count, the session gate, the two engagement signals, the trail, the strip's cap and collapse, the box that explains the cap, and the rendered sheet — the repaired table, the three figure alignments, the labelled and openable redactions, and raw HTML left inert; `bun run lint` and `bun run typecheck` for the rest.

The Markdown renderer's own contract is held in [`../../lib/markdown/README.md`](../../lib/markdown/README.md) and the `markdown-*.test.*` files: the corpus's table must parse to seven rows of four cells, its six redactions must resolve in document order, and no target may print a withheld word.

The layout was verified in headless Firefox at 1440, 1280, 1180, 1024, and 700 pixels wide, across a filed record, a sealed one, a held one, an organization with a withheld designation, the two-up arrangement, and the empty margin. The two on-open glitches are shorter than the capture fires, so the scale blip and the margin nudge were photographed with their animations stretched and their delays removed; the stretch was scaffolding and is not in the tree. The message box that explains the cap is verified by test rather than by capture: it is a portalled Radix surface, and the capture pipeline fires before hydration, so no dialog has ever appeared in one of these photographs.

## Copy and language

Every word the frame prints is interface copy, and it lives in the `reader` namespace: one flat catalog per language, [`messages/en/reader.json`](../../../messages/en/reader.json) and [`messages/ko/reader.json`](../../../messages/ko/reader.json). The components read it through `useTranslations("reader")`, so no label is authored inside a component, and `READER_VOCABULARY` — the object that once held the vocabulary in `reader-identity.ts` — is gone; that module keeps the name, the handle, and the user codes, and the catalog keeps the vocabulary's argument: a record is not commented on, corroborated or contested with a like, or reached through references.

Two kinds of string stay in English on purpose, and a translation pass should leave them alone. The first is the model's own labels in `reader-model.ts` — the view, typeface, and size names, the five assessment words, and the search-count sentence — because that module is the frame's structure rather than its copy and its labels are held by the model's tests. The second is everything filed: a record's section headings, the borrowed catalogue fields and the withheld note in `record-filings.tsx`, the citation types in `reader-correspondence.ts`, the relative phrases on a note ("3 days ago", "Just now"), and the corpus itself. The Korean chrome follows [`shell.json`](../../../messages/ko/shell.json)'s terms — 심사자, 문의인, 기록, 열람, 문서철 — with 주석 for annotations, 심사 for assessment, 척도 for scale, 뒷받침 for corroboration, and 이의 제기 for a contest.
