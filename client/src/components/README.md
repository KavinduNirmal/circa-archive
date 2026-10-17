# Reusable components

## Responsibility and structure

- `desktop-icons.tsx`: destination-to-artwork map (Windows 98 bitmaps in `public/icons`), the `.lnk` shortcut marker, and the taskbar tray glyphs.
- `desktop-navigation.tsx`: shared shortcut definitions, the My PC contents list, and the desktop/Start navigation.
- `language-switcher.tsx`: the reader's own choice of language, rendered on the landing page's utility bar and in the workstation tray and Settings. `language-switcher.css` is colourless on purpose, so one control reads on both surfaces; imported by the component.
- `window-manager.tsx`: the open-window registry (`useWorkstationWindows`), the draggable and resizable `WorkstationWindow`, the `WindowLayer` canvas, and `TaskbarWindows` entries.
- `desktop-shell.tsx`: wallpaper, taskbar, real UTC clock, Start launcher, notification popover, Settings modal, and the desktop layer that hosts windows.
- `workstation.css`: the chrome those shell files render — desktop rail, taskbar and tray, Settings, Start, the window frames, and the CRT screen filter. Imported once, by `desktop-shell.tsx`.
- `browser/`: the in-world archive browser behind the Search destination; see its [README](browser/README.md).
- `mail/`: the Outlook-era mail client behind the Inbox destination; see its [README](mail/README.md).
- `files/`: the CIRCA Explorer file browser behind every folder destination; see its [README](files/README.md).
- `word/`: the Markdown record editor behind CIRCA Word; see its [README](word/README.md).
- `reader/`: the record reader that opens when a record is opened; see its [README](reader/README.md).
- `site/`: the diegetic public agency portal and the workstation post screen; see its [README](site/README.md).
- `ui/`: shadcn/ui primitives with CIRCA styling, including the in-world [message box](ui/message-box.tsx) both applications share.

## Structure of the navigation model

`desktopFolders` is the desktop reading order; `myPcContents` holds locations reachable only inside My PC. Both use the same `DesktopEntry` shape — a stable `id`, a `messageKey` into the `shell` namespace, an optional `ready` flag, and an `icon` — so one `DesktopIcon` renders every destination and no entry can be added with English copy welded to it. `desktopLabel`, `desktopDetail`, and `desktopCopy` read the copy for whoever needs it; the shell composes a window title from it, and the file browser names itself for the folder it was given. Destinations with `icon.shortcut` receive the shortcut marker overlay in addition to their glyph.

## Copy and language

Every component in this folder reads its copy from the catalogs under `../messages/<locale>/` — one file per namespace — through `useTranslations(<namespace>)`. No sentence a reader sees is authored here. The shell uses `shell` and `boot`, the language switcher uses `switcher`, and each application window owns a namespace of its own: `browser`, `mail`, `files`, `word`, `reader`.

The boundary that matters is between chrome and filed content. Menus, buttons, labels, column headers, status lines, notices, empty states, and aria-labels are chrome, and they are translated. The fiction's filed documents — the archive index, the incident titles, the record corpus, the mail fixture, the file tree — stay as filed in both languages, because an archive does not translate a document that was filed in English; those live in each app's `*-index.ts`, `*-sources.ts`, `*-correspondence.ts`, and `ghost-story.ts`. The in-world identity modules (`*-identity.ts`) keep the product names as constants, and the shell composes each window's title from `shell` so a titlebar and its taskbar entry follow the reader's language.

Each app's own README records where its copy lives, which strings stay filed, and any remaining gap. `tests/i18n-windows.test.tsx` opens every window in Korean and asks it for a word from its own namespace, so a window that was never wired cannot pass.

## Window model

A destination opens as one window per destination id: reopening focuses the existing frame rather than duplicating it. `useWorkstationWindows` owns geometry, stacking (`z`), minimize, and maximize; `geometry` is the restore target so maximize never loses the frame.

Windows are plain positioned elements, not modal dialogs, so several can be open at once. The registry keeps focus on the top *visible* window: minimizing or closing the active window hands focus to the next visible one rather than leaving the shell without an active window, and a minimized window stays open until it is closed. A gesture paints `left`/`top`/width/height straight onto the frame and commits to the registry once on release, which keeps a drag off the React render path entirely; gestures are keyed by pointer id and take pointer capture on the titlebar, with a window-level `pointerup` fallback so a gesture can never outlive its pointer. `react-rnd` was the first attempt and was removed from rendering: it always writes its own `transform` and will not yield to inline geometry, which double-applied a controlled position and made a drop land somewhere other than the cursor. The dependency is still installed but unused.

Settings stays a full-screen modal: it is workstation chrome, not a document window. A window's generic status strip is omitted when its destination renders its own status bar, which is what the browser, the mailbox, the editor, and the reader all do.

A destination may also ask to open maximized, which is how the reader arrives: full screen in the desktop sense, with the taskbar still under it. The flag is read only when the window is created, so restoring a frame by hand is never undone by a later open.

A minimized window is hidden rather than unmounted. It costs one hidden element and buys back whatever the window was holding: the browser's history, the editor's undo stack, and the reader's place in a record all survive a trip to the taskbar. The `hidden` attribute does the hiding, so assistive technology stops seeing the window at the same moment the screen does.

## Boundaries and verification

The shell owns local presentation state only. Destination contents, records, authorization, and backend requests are future work, with one exception: the Search destination opens the archive browser, whose fixture index is labeled as illustrative preview content rather than canon. Radix supplies accessible dialog/popover behavior. Icons render at 48px on the desktop and 32px in Start; each destination either names a bitmap or a Lucide fallback, so swapping artwork never touches layout code. Run client lint, typecheck, unit tests, and browser tests after interaction changes.
