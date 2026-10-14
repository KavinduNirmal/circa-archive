# Reusable components

## Responsibility and structure

- `desktop-icons.tsx`: destination-to-artwork map (Windows 98 bitmaps in `public/icons`), the `.lnk` shortcut marker, and the taskbar tray glyphs.
- `desktop-navigation.tsx`: shared shortcut definitions, the My PC contents list, and the desktop/Start navigation.
- `window-manager.tsx`: the open-window registry (`useWorkstationWindows`), the draggable and resizable `WorkstationWindow`, the `WindowLayer` canvas, and `TaskbarWindows` entries.
- `desktop-shell.tsx`: wallpaper, taskbar, real UTC clock, Start launcher, notification popover, Settings modal, and the desktop layer that hosts windows.
- `browser/`: the in-world archive browser behind the Search destination; see its [README](browser/README.md).
- `ui/`: shadcn/ui primitives with CIRCA styling.

## Structure of the navigation model

`desktopFolders` is the desktop reading order; `myPcContents` holds locations reachable only inside My PC. Both use the same `DesktopEntry` shape (stable `id`, `label`, `detail`, `icon`) so one `DesktopIcon` renders every destination. Destinations with `icon.shortcut` receive the shortcut marker overlay in addition to their glyph.

## Window model

A destination opens as one window per destination id: reopening focuses the existing frame rather than duplicating it. `useWorkstationWindows` owns geometry, stacking (`z`), minimize, and maximize; `geometry` is the restore target so maximize never loses the frame.

Windows are plain positioned elements, not modal dialogs, so several can be open at once. The registry keeps focus on the top *visible* window: minimizing or closing the active window hands focus to the next visible one rather than leaving the shell without an active window, and a minimized window stays open until it is closed. A gesture paints `left`/`top`/width/height straight onto the frame and commits to the registry once on release, which keeps a drag off the React render path entirely; gestures are keyed by pointer id and take pointer capture on the titlebar, with a window-level `pointerup` fallback so a gesture can never outlive its pointer. `react-rnd` was the first attempt and was removed from rendering: it always writes its own `transform` and will not yield to inline geometry, which double-applied a controlled position and made a drop land somewhere other than the cursor. The dependency is still installed but unused.

Settings stays a full-screen modal: it is workstation chrome, not a document window. A window's generic status strip is omitted when its destination renders its own status bar, which is what the browser does.

## Boundaries and verification

The shell owns local presentation state only. Destination contents, records, authorization, and backend requests are future work, with one exception: the Search destination opens the archive browser, whose fixture index is labeled as illustrative preview content rather than canon. Radix supplies accessible dialog/popover behavior. Icons render at 48px on the desktop and 32px in Start; each destination either names a bitmap or a Lucide fallback, so swapping artwork never touches layout code. Run client lint, typecheck, unit tests, and browser tests after interaction changes.
