# Static assets

## Responsibility and structure

The supplied government-agency emblem JPG is the desktop wallpaper, served directly by Next.js. Its filename is preserved. `icons/` holds the Windows 98 shortcut bitmaps and their [mapping notes](icons/README.md).

`circa_full_logo.svg` is the Commission's mark — the eye with the `C.I.R.C.A` wordmark beneath it — and the public portal's masthead renders it on a paper plate, because the artwork is black and the masthead is steel. `circa_eye.svg` (the emblem alone) and `circa_serpant.svg` (the ring) are supplied alongside it and are not yet used; the PNGs are raster exports of the same artwork and nothing in the application reads them.

## Boundaries and usage

Reference assets by their root URL. Executable components belong in `../src/`. The desktop provides a solid navy fallback while the wallpaper loads, and the wallpaper renders at full strength with no dimming overlay. Preserve supplied assets unless the user requests changes.
