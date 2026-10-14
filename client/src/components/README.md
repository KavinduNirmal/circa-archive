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

A destination opens as one window per destination id: reopening focuses the existing frame rather than duplicating it. `useWorkstationWindows` owns geometry, stacking (`z`), minimize, and maximize; `geometry` is the restore target so maximize never loses the frame. Dragging and resizing are pointer handlers on the titlebar and corner grip that write explicit `left`/`top` and width/height, clamped to the desktop layer; react-rnd renders the frame and its handles but does not drive position, because its own drag path double-applies the offset when a position prop is supplied. Settings stays a full-screen modal: it is workstation chrome, not a document window.

## Boundaries and verification

The shell owns local presentation state only. Destination contents, records, authorization, and backend requests are future work. Radix supplies accessible dialog/popover behavior. Icons render at 48px on the desktop and 32px in Start; each destination either names a bitmap or a Lucide fallback, so swapping artwork never touches layout code. Run client lint, typecheck, unit tests, and browser tests after interaction changes.
