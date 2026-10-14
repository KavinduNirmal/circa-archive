# Reusable components

## Responsibility and structure

- `desktop-icons.tsx`: destination-to-artwork map (Windows 98 bitmaps in `public/icons`), the `.lnk` shortcut marker, and the taskbar tray glyphs.
- `desktop-navigation.tsx`: shared shortcut definitions, the My PC contents list, and the desktop/Start navigation.
- `window-manager.tsx`: the open-window registry (`useWorkstationWindows`), the draggable and resizable `WorkstationWindow`, the `WindowLayer` canvas, and `TaskbarWindows` entries.
- `desktop-shell.tsx`: wallpaper, status strip, taskbar, real UTC clock, Start launcher, notification popover, Settings modal, and the desktop layer that hosts windows.
- `ui/`: shadcn/ui primitives with CIRCA styling.

## Structure of the navigation model

`desktopFolders` is the desktop reading order; `myPcContents` holds locations reachable only inside My PC. Both use the same `DesktopEntry` shape (stable `id`, `label`, `detail`, `icon`) so one `DesktopIcon` renders every destination. Destinations with `icon.shortcut` receive the shortcut marker overlay in addition to their glyph.

## Window model

A destination opens as one window per destination id: reopening focuses the existing frame rather than duplicating it. `useWorkstationWindows` owns geometry, stacking (`z`), minimize, and maximize; `geometry` is the restore target so maximize never loses the frame. Dragging and resizing are pointer handlers on the titlebar and corner grip: during a gesture they write `left`/`top`/width/height straight to the frame and commit to the registry once on release, so a drag does not re-render the shell at pointer frequency. Geometry is also passed to react-rnd as explicit CSS, because react-rnd's own transform double-applies a controlled position; keeping the frame's box authoritative is what makes the drop land under the cursor. Pointer capture is taken on the titlebar so release always reaches the handler that started the gesture. Settings stays a full-screen modal: it is workstation chrome, not a document window.

## Boundaries and verification

The shell owns local presentation state only. Destination contents, records, authorization, and backend requests are future work. Radix supplies accessible dialog/popover behavior. Icons render at 48px on the desktop and 32px in Start; each destination either names a bitmap or a Lucide fallback, so swapping artwork never touches layout code. Run client lint, typecheck, unit tests, and browser tests after interaction changes.
