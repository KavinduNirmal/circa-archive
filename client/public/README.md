# Static assets

## Responsibility and structure

The supplied government-agency emblem JPG is the desktop wallpaper, served directly by Next.js. Its filename is preserved. `icons/` holds the Windows 98 shortcut bitmaps and their [mapping notes](icons/README.md).

`circa_full_logo.svg` is the Commission's mark — the eye with the `C.I.R.C.A` wordmark beneath it — and the public portal's masthead renders it on a paper plate, because the artwork is black and the masthead is steel. `circa_snake_with_eye.svg` is the archive masthead's seal: the reading edition uses it as a CSS mask, painted by the surrounding text colour, so the artwork stays black on disk and still takes any colour in the interface. `circa_eye.svg` (the emblem alone) and `circa_serpant.svg` (the ring) are supplied alongside them and are not yet used; the PNGs are raster exports of the same artwork and nothing in the application reads them.

`Ghost_story.md` is the published copy of the renderer's test corpus, `CIRCA-S-03007`, and the file to edit when the corpus changes. The workstation reader is a browser bundle and cannot read it at runtime, so `../src/components/reader/ghost-story.ts` carries the same bytes; run `bun run sync:corpus` after editing this file. The figures in the corpus point at remote test images, so the reading surfaces need a network connection to show them; they are rendered through `next/image`, and their host is allowlisted in `next.config.ts`.

## Boundaries and usage

Reference assets by their root URL. Executable components belong in `../src/`. The desktop provides a solid navy fallback while the wallpaper loads, and the wallpaper renders at full strength with no dimming overlay. Preserve supplied assets unless the user requests changes.

The Windows 98 shortcut bitmaps in `icons/` and the supplied wallpaper are not MIT-licensed. Read the root [asset notice](../../NOTICE) before redistributing either one.
