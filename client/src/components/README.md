# Reusable components

## Responsibility and structure

- `desktop-icons.tsx`: destination-to-artwork map (Windows 98 bitmaps in `public/icons`), the `.lnk` shortcut marker, and the taskbar tray glyphs.
- `desktop-navigation.tsx`: shared shortcut definitions, the My PC contents list, and the desktop/Start navigation.
- `desktop-shell.tsx`: wallpaper, taskbar, real UTC clock, Start launcher, notification popover, Settings dialog with the CRT toggle, and workstation dialogs.
- `ui/`: shadcn/ui primitives with CIRCA styling.

## Structure of the navigation model

`desktopFolders` is the desktop reading order; `myPcContents` holds locations reachable only inside My PC. Both use the same `DesktopEntry` shape (stable `id`, `label`, `detail`, `icon`) so one `DesktopIcon` renders every destination. Destinations with `icon.shortcut` receive the shortcut marker overlay in addition to their glyph.

## Boundaries and verification

The shell owns local presentation state only. Destination contents, records, authorization, and backend requests are future work. Radix supplies accessible dialog/popover behavior. Icons render at 48px on the desktop and 32px in Start; each destination either names a bitmap or a Lucide fallback, so swapping artwork never touches layout code. Run client lint, typecheck, unit tests, and browser tests after interaction changes.
