# Record reader

## Responsibility

The window that opens when a record is opened, from the archive index or from a follow-up filed against another record. It is the platform's primary reading surface, and it is styled as an off-brand PDF reader from the same era as the rest of the workstation: dense tool plates, a strip of page previews, a scale readout, marginalia, and a filing tray of subsequent records.

**It never renders a PDF.** There is no parser, no canvas, and no pagination. The window is a container: it frames a record and provides one slot for a body. Everything around the slot is the frame's; everything inside it belongs to whoever mounts a renderer.

That split is enforced, not just described. `RecordReader` renders each section as a named, empty anchor unless the host passes `renderSection`, and a test holds it to that. The desktop supplies `RecordFilingBody` from `record-filings.tsx`, which is the stand-in for the Markdown renderer described in `MARKDOWN_RENDERER_PLAN.md`. When that renderer lands it replaces one prop at one call site in `desktop-shell.tsx`.

## Structure

- `reader-model.ts`: the vocabulary, the scale steps, the printed section numbers and anchors, and the pure text measurement. No React, no DOM.
- `record-filings.tsx`: the record service, stood in for. Builds a sectioned `RecordDocument` out of an index entry, and renders one section's blocks as the body the frame is handed. This is the seam the real renderer replaces.
- `reader-correspondence.ts`: the annotations filed against a record and the citations between records, both read from the archive index rather than restated.
- `reader-session.ts`: the reviewer's session. Who is at the terminal, notes filed, endorsements, assessments, and votes, plus the merge that folds all of it into the margin for one record.
- `reader-chrome.tsx`: the toolbar and its two zones, the page-arrangement menu, and the credentials prompt.
- `reader-rails.tsx`: the left rail of section previews and the right rail of marginalia, with its composer.
- `reader-references.tsx`: the follow-up strip.
- `reader-window.tsx`: the composition, the view and scale state, the search pass, and the body slot.

## The reader as a window

It opens **maximized, not fullscreen**: the taskbar stays, so the desktop metaphor survives and the frame still minimizes, restores, resizes, and closes like any other window. The frame drops its generic status strip because the reader prints its own.

`useWorkstationWindows().open` takes a `maximized` flag for this. That flag is only read when the window is created, so restoring a frame by hand is never undone by another open. Minimized windows are now hidden rather than unmounted, which is what lets the reader come back to the record and the scale it was left on; the same change is why the browser keeps its history across a trip to the taskbar.

The record trail lives in the shell, because the shell is what opens a record. A code clicked in the archive and a code clicked in a follow-up strip are the same event, so they take the same path and the viewer needs no effect to notice a new record.

## The frame's decisions

| Question | Decision |
| --- | --- |
| What is a "page"? | A section. The body is Markdown and has no page boundaries, so auto-pagination would renumber itself on every resize. A record has sections, which is stable, cheap, and true to the archive. |
| What anchors a note? | A section, not a text selection. Text anchoring needs a stable reference model inside the renderer; a margin note hangs beside a page, not beside a word. |
| What is the sheet? | One continuous paper surface with a `68ch` measure, capped so a long line never arrives. No page borders and no per-page shadows. |
| What does the scale change? | Type size, in tens from 80% to 160%, with a unitless line height so the leading follows. The measure is in `ch`, so the line stays the same length in characters at every scale. |
| Where is the search read from? | The sheet's own DOM, not the document model. The host's renderer may emit anything, so matches are found by walking what was rendered and painted with the custom highlight API, which never rewrites the renderer's output. The count is written into its own node by that effect rather than held in React state, because React cannot know it either. |

## Three controls that do nothing

**Rotate**, **Print**, and **Download** are shipped, styled identically to the working tools, focusable, and inert. They do not warn, they do not open a box, they do not disable themselves. This is a deliberate departure from the rule the rest of the workstation follows, where a control that cannot act says so on itself, and it is the one place in the shell where the software is older than its promises. Download is the single exception that states a reason, on its `title`, because a clearance refusal is something the institution would say out loud.

Everything else works: the three page arrangements, both scale buttons and the reset readout, fit to margin, search with its match count, the section rail, the annotation rail and its composer, endorsements, the assessment scale, corroboration and contest, the follow-up strip, and the trail's Back and Ahead.

## Engagement

Rating is quality; the vote is agreement. They are separate signals and are kept visually separate: the assessment is a five-point institutional scale (`—`, `Marginal`, `Adequate`, `Sound`, `Exemplary`) as a row of stamped plates in its own bordered group, while corroborate and contest are a check and a cross. A sound record can be contested, and the tests hold that line.

All of it needs a reviewer session. A guest sees the controls, hovers them, and is asked once at a single modal with one line of text and one button reading `Enter`; the action that raised the prompt then completes. The assessment is a real radio group, so the scale keeps its arrow keys and one tab stop.

## Content, and how honest it is

`record-filings.tsx` follows two rules. A record's metadata is never restated: class, dates, holder, status, and clearance are read from the index entry, so the sheet cannot disagree with the catalogue. And a body is authored only for a record the preview has released; everything else renders the withheld shape, which is a real state of this screen. Four records carry a filed body and seventeen are reachable, so both states are one click apart.

A citation card is the citing record's own index entry, not a second description of it. A note that names a section the record does not have is dropped rather than pinned to the wrong one. The follow-up types are exhaustive over the index, so a new record cannot silently default to being a discovery. The sheet carries the preview's honesty marker in its footer and the status bar repeats it.

## Visual contract

Three materials, and the split is the argument of the screen. The chrome is the workstation's steel. The sheet is the brightest paper in the system, because it is the document itself rather than a page about one. The margin is cream, ruled, and dark-inked, with a red margin rule and a punched hole on each slip: it is the only warm surface in CIRCA/OS, and it is warm because marginalia is written on paper made for writing on.

- **Composition.** Toolbar across the top; section rail, sheet, and margin across the middle; follow-ups along the bottom; status bar last. The sheet loses width before it loses its measure.
- **Toolbar.** Document actions left, engagement right, separated by engraved dividers. Tools are a glyph over an 8px label, or a glyph alone where the icon already says the word. The scale readout is a control, not a readout.
- **Hierarchy.** The leaf is the loudest thing on the sheet: code, designation at 1.8em, then one metadata line separated by hairlines rather than a table, because a table is what the record view this replaced used and a reader should read as a document header.
- **The withheld body.** Drawn as three redaction bars under a stamp, matching how the index draws a withheld name; the rail's preview for that section turns from paper to hazard.
- **States.** A record at every status; a withheld body; a designation withheld; a code the index does not carry; no record open; an unannotated record; no follow-ups. Every one of them is reachable, and none of them is a dead end.
- **Reflow.** Below 1024px both rails are strips by default and open as overlays rather than pushing the sheet; below 1100px two-up folds to one column; below 768px the follow-up groups stack and their cards stop pretending to be a filmstrip. The rail's collapse is the one place where the same breakpoint is declared twice, once in the container query that produces the default before hydration and once in the hook that decides what the first click means.

## Motion

Three one-shot glitches, all CSS, all with a hidden or settled base state, which is the entire reduced-motion story: declining to animate is enough.

1. The toolbar settles in a frame or two after the sheet.
2. The scale readout blips to `102%` and back.
3. The margin slips six pixels and settles.

The preview rail shows a section that is not in the record and then corrects itself, which is timed in a keyframe rather than in state so nothing has to remember that it happened. All four collapse under `prefers-reduced-motion`, and the sheet's smooth scrolling goes with them.

## Boundaries and verification

Reading, and only the record in front of it. Notes, endorsements, and votes are session state: they are not persisted, not authorized, and not sent anywhere, and the reviewer credential is a fixed handle rather than an authentication. There is no filing, no rating aggregate, and no backend.

Run `bun run test` for the model, the filings, the correspondence, the frame's slot, the three silent controls, the scale limits, the arrangements, the search count, the session gate, the two engagement signals, and the trail; `bun run lint` and `bun run typecheck` for the rest.

The layout was verified in headless Firefox at 1440, 1280, 1180, 1024, and 700 pixels wide, across a filed record, a sealed one, a held one, an organization with a withheld designation, the two-up arrangement, and the empty margin. The two on-open glitches are shorter than the capture fires, so the scale blip and the margin nudge were photographed with their animations stretched and their delays removed; the stretch was scaffolding and is not in the tree.
