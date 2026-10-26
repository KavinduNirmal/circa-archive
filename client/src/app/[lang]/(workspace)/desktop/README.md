# Desktop shell

## Responsibility and structure

`page.tsx` is a URL marker for `/{lang}/desktop`; the shell, the post screen, and the metadata live in the workspace [layout](../README.md), so they survive an in-workspace navigation. The home route is the public landing page, which links here in the reader's own language. Reusable navigation, icons, and shell presentation live in `../../../../components/`.

## Scope and design decisions

The user's reference image controls composition: a left shortcut rail, open wallpaper, and compact desktop chrome. The supplied emblem is the wallpaper, dimmed without desaturating it. The detailed DESIGN.md steel palette supplies colors; ARCHITECTURE.md supplies provisional shortcut names, not binding functionality. A bottom Windows-style taskbar replaces the reference's dock, and the desktop layer runs the full height behind it. A static, pointer-transparent CRT overlay covers the whole screen.

This pass implements local shortcut selection, a Start launcher, the taskbar tray, and the window manager: one draggable and resizable window per destination, with minimize, maximize/restore, stacking, and a taskbar entry for each open window. Every window is still an explicit unconnected placeholder except **Search**, which opens the archive browser ([README](../../../../components/browser/README.md)), and **Inbox**, which opens the mail client ([README](../../../../components/mail/README.md)). Records, filing, authentication, and the remaining application screens are outside scope. Shortcuts support single-click, touch, and keyboard activation. Escape closes the focused window or the Settings dialog, and a window's own close button returns focus to the shortcut that opened it.

Navigation and icon decisions from the redesign request:

- **My PC** is the workstation container. Its computer glyph is never drawn on top of a folder, and **System** is nested inside it instead of sitting on the desktop. Opening System shows `DESKTOP / MY PC / SYSTEM` and a **Back to My PC** track, following the constrained-terminal breadcrumb in DESIGN.md.
- Every destination uses supplied Windows 98 artwork: My PC the workstation, Archive the open file cabinet, Organizations the old Network icon, My Documents the closed folder, Inbox the sealed envelope, CIRCA Word (renamed from `WRITE.exe`) the write-file document, Search the search bitmap, and System the console prompt shown inside My PC.
- **Archive** and **\_EXPUNGED** carry the Windows 98 `.lnk` shortcut marker in the lower-left corner. The marker is decorative: no filesystem linking behavior is implied.
- Shortcut art renders at 48 CSS pixels from the Win98 bitmaps with nearest-neighbour scaling, then dulls toward the workstation's grey-blue with a per-pixel CSS filter (`saturate(.4) brightness(.85)`, 88% opacity). Two constraints keep it honest: the filter is applied to the bitmap element rather than as a blended overlay, because the PNGs are transparent and an overlay paints a visible tile behind each icon; and it desaturates without shifting hue, because a sepia or hue-rotate chain turned the globe's greens magenta. Labels sit directly on the wallpaper with a four-way text outline instead of the previous filled plate, so the emblem reads through.
- Desktop reading order is fixed as My PC, My Documents, Archive, Organizations, Inbox, CIRCA Word, Search, _EXPUNGED, Recycle Bin: workstation containers first, then the editor, then the archive tools. The editor keeps its place between Inbox and Search rather than being pushed to the end.
- **Search opens the browser and Inbox opens the mail client, and each names its own window.** The shortcuts keep their labels and their bitmaps, but the frames are titled `Titan Browser - CIRCA Archive` and `Titan Mail - CIRCA Correspondence`, and their taskbar entries match. Because both applications print their own status bars, those frames omit the generic destination strip (`WorkstationWindow` renders that strip only for a non-null status), so the chrome is not stacked twice.
- One class of bug is worth naming because neither the unit suite nor the type checker could see it: a CSS class name reused for two different elements. `archive-fields` and `mail-body` were each used twice, and in both cases a rule written for a table or a paragraph silently resized a layout container. The mail client's panes only filled the frame after the collision was found by measuring the rendered box, so class names in this stylesheet are treated as a namespace: check for an existing name before adding one.
- The taskbar follows the reference arrangement: Start, a beveled divider with 8px breathing room, then **Settings** as a wide task-button item, with the notification bell sitting in the tray directly beside the UTC clock. The reference build's activation notice was dropped rather than imitated. Settings presses into its sunken state while its dialog is open. Notifications open an honest unconnected panel; **Settings** hosts the CRT screen filter, which replaced the old taskbar CRT button. The screen filter remains on by default.

## Landing page and the post screen

The home route is now the public landing page, so the workstation is reached rather than opened directly, and `/{lang}/desktop` answers that arrival by powering the machine on. `WorkstationBoot` ([README](../../../../components/site/README.md)) mounts the shell and covers it with the post screen; the shell stays `aria-hidden` and `inert` until the last check resolves, so the handover is a reveal instead of a page load. The lines report what the shell actually mounted. Any key, or the Skip post button, hands the screen over at once, and an operator whose system asks for reduced motion never sees the post screen at all.

The fiction needs one door out, since the landing page is how everyone arrives. The Start launcher's last row is **Public archive site**, a real link to the landing page in the reader's language, labelled with the archive's book mark and left outside the application list so it does not read as another destination.

## Deep links and history

The workstation is addressable without giving up the desktop as the thing that arranges itself:

```text
/{lang}/desktop                     the workstation, nothing focused
/{lang}/desktop/{destination}       one of the rail shortcuts, or System
/{lang}/desktop/record/{code}       the reader on an archive code
```

A record code is one percent-encoded path segment, and every shipped code fits in one. `src/lib/desktop-route.ts` owns both directions of the mapping, and `tests/desktop-route.test.ts` round-trips every destination and every released code.

The history policy has one writer. `DesktopUrlSync` ([notes](../../../../components/README.md)) reads the pathname, adopts it into the store, and writes the store's focus back:

- Opening a destination or a record pushes a new entry.
- Taskbar focus, minimize, close, and the reader's own Back/Forward replace the current entry.
- A deep link, browser Back, and browser Forward only adopt the address; they write nothing.
- Closing the focused window replaces the address with the surviving window, or `/desktop` when none is left.

Two races are named in the code because they are not obvious. A write is applied asynchronously, so the adapter must not read its own unwritten address back as a navigation; and a window closed before its push lands must not be resurrected when the address arrives. Both are covered in `tests/desktop-url.test.tsx`.

An unknown destination or code is a 404, matching the public record route, and every route here is `noindex, nofollow`. The canonical, indexable address for a record remains `/{lang}/site/records/{code}`.

A refresh restores the workspace from the tab's `sessionStorage` ([store notes](../../../../stores/README.md)); the URL's window takes focus. Deferred deliberately: folder paths, browser search state, mail selection, and editor drafts are not URLs, and windows do not survive a visit to the public archive.

## Verification

Run `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run test:e2e` from `client/`. The browser suite covers the deep-link matrix in `e2e/desktop-deeplink.spec.ts`.

## Visual contract

Reading this as an archive workstation for fictional CIRCA analysts, in a restrained early desktop visual language. ENERGY 2 / RHYTHM 1 / MOTION 1. The supplied reference and project design provide direction; antislop-ui and UI Taste guide implementation and review.

- The navy/steel palette and local DM Sans preserve the existing institutional identity. IBM Plex Mono is reserved for values that must align or read as data: the real UTC clock, archive codes and filing dates, and the browser's address bar.
- A single left-aligned shortcut rail leaves desktop space for the emblem; shared bitmap artwork plus the shortcut marker distinguishes destinations without decorative emoji. The rail's nine rows share the desktop layer's height, and row height is declared together with cell content so a cell can never outgrow its row and push later icons out of the layer.
- The emblem remains the focal point. It is darkened with `brightness(.78) contrast(1.06)` while saturation is nudged up (`saturate(1.12)`) so the seal's blue survives the dimming; plain desaturation was rejected because it greyed the blue out. Icon artwork is desaturated toward the shell's grey-blue so it reads against the photograph instead of competing with it.
- A window's taskbar entry is pressed while it is open and pressed further while it holds focus, so the active window is readable from the taskbar. The close control is the one red element, marking the only destructive action. A muted amber Start mark identifies the launcher. The notification panel states that delivery is not connected.
- Hover hints are the beveled shadcn tooltip, not native browser titles: an outlined plate, uppercase micro-label, and hard offset shadow with a stroked arrow. Tooltips appear only where the label needs explaining, so the Start menu, whose rows are already labelled, stays tooltip-free.
- Scanlines and a faint edge vignette simulate the requested screen surface. The Settings checkbox toggles the overlay, which never intercepts input and has no animation.
- On narrow screens, the icon rail uses two columns with 44px taskbar targets, and secondary chrome collapses. Short viewports allow icon scrolling.
- Windows open inset from the desktop-layer edge with a cascading offset, and drag and resize are clamped to that layer so no frame can be parked under the taskbar. Opening a destination that is already open focuses its window instead of duplicating it.
- Window placeholders keep focus management: Escape closes the focused window, closing with the titlebar control returns focus to the launching shortcut, and each open window has a taskbar entry that restores it from a minimized state. No network requests means loading and server-error states are not applicable yet.

Finish condition: verify all shortcuts, Start, the tray controls, window drag/resize/minimize/maximize, dismissal and focus, the CRT toggle, both applications' documents and refusals, and overflow at desktop, reference-size, and mobile viewports; inspect the resulting screenshots.

## Archive browser chrome

The browser is a new surface inside an established product, so it inherits the shell's visual system and changes only its composition. Its chrome is steel, beveled, and uppercase; the document inside the tab is not, because a browser is a frame around someone else's page. Full detail, including the paper-surface decision, the reflow breakpoints, and the refusals, is in the browser's own [README](../../../../components/browser/README.md).

One shell-level change came with it: a menu, popover, or alert that handles Escape now consumes that press, so dismissing an open overlay no longer also closes the focused window. The shell's Escape handler skips an event that was already `defaultPrevented`.

## Verification log: archive browser

Verified on 2026-10-15 by server-rendering the browser into headless Firefox (157.0.1) at seven window sizes and inspecting pixels, plus the unit suite. Rendered and inspected: the index as a primary search page, the incidents listing as an eight-row table, a withheld record, the no-match recovery, the compact search block above a record, the refusal and About message boxes, the View menu panel, text size at large, and the 400px frame. Findings fixed in the same pass:

- The compact search block had been reduced to two dotted rules, which read as a broken border; it is now an outlined block of the same fields, and the filled plate is what distinguishes the index's primary search block.
- Firefox drew its own native chrome for the `<select>` elements, so the two dropdowns ignored the paper palette and disagreed with the text input beside them. Both fields now clear `appearance` and share one sunken well, and the select's caret is drawn in CSS.
- The masthead wrapped the seal onto a line of its own in a narrow frame. The seal and its text are now one flex item, so only the clearance stamp can wrap.
- Two measure overruns left a single word on the second line; the measure and one sentence were tightened.
- The record's back button promised "Return to results" even when the record was opened from the index; it now names the document it actually returns to.

## Verification log: mail client

Verified on 2026-10-15 by rendering the client into headless Firefox at five frame widths and reading the pixels, plus the unit suite. Rendered and inspected: the Inbox with its Outlook Bar, grid, and empty reading pane; a selected message with its header block and body; a reply with the recipient, subject, and quoted original; the narrow frame; and the archive's record and result documents after the shared stylesheet changed. Findings fixed in the same pass:

- The panes filled only a fraction of the frame. Measured computed boxes showed `.mail-body` at 467px inside a 972px window; the cause was a second `.mail-body` rule written for the letter paragraphs in the reading pane, whose `max-width: 68ch` was capping the layout container. The paragraphs are now `.mail-letter`, and a duplicate-selector audit was run over the whole stylesheet, which also caught `.archive-fields` shared by the archive's search row and its record table.
- Importance, read state, and attachment glyphs sat in one flex row, so the paperclip drifted depending on the marks before it. Each glyph now owns a fixed slot, and the headers share the same slots, so the columns line up.
- Folder buttons sized to their content, so the rows and the icons drifted with each label's line count. Every row now has one height.
- The menu bar rendered unstyled because the mail chrome still used the browser's old class names after the shared menu chrome was renamed.
- The viewer pane was the archive's grey-blue paper. It is now white, scoped to `.mail-view` so the message list keeps the look it already had, and the composer shares that pane.
- Folder rows were sized by their labels, so a two-line label moved its icon. Every row is now one width with a full-width, centred label and one height, so the icons form a column whatever the text does.
- Every folder mark came from the full Windows 98 set rather than a stand-in: Drafts and Outbox from the artwork supplied for them, Sent Items a filed message instead of the archive cabinet, and Dead Letters the error mark instead of an erased file. The Inbox shortcut carries the mail client's own mark. The read and unread marks in the list stay Lucide hairlines, because a bitmap at 12px is below the pixel grid's usable range.

Limitation: headless Firefox screenshots fire before React hydrates, so the two Radix-portaled surfaces (the message boxes and the menu panel) were inspected as static replicas of their production markup and class names. Their behaviour is covered by the unit tests instead. The Playwright suite was again not run: Chromium is not installed and this environment's Playwright install target is read-only.
