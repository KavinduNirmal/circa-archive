# Static assets

## Responsibility and structure

The supplied government-agency emblem JPG is the desktop wallpaper, served directly by Next.js. Its filename is preserved. `icons/` holds the Windows 98 shortcut bitmaps and their [mapping notes](icons/README.md).

## Boundaries and usage

Reference assets by their root URL. Executable components belong in `../src/`. The desktop provides a solid navy fallback while the wallpaper loads, and the wallpaper renders at full strength with no dimming overlay. Preserve supplied assets unless the user requests changes.
