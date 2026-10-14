# Desktop shell

## Responsibility and structure

`page.tsx` mounts the initial CIRCA/OS desktop at `/desktop`. The home route mounts the same shell. Reusable navigation, icons, and shell presentation live in `../../components/`.

## Scope and design decisions

The user's reference image controls composition: a left shortcut rail, open wallpaper, and compact desktop chrome. The supplied emblem is the wallpaper, rendered at full strength with no dimming layer. The detailed DESIGN.md steel palette supplies colors; ARCHITECTURE.md supplies provisional shortcut names, not binding functionality. A bottom Windows-style taskbar replaces the reference's dock. A static, pointer-transparent CRT overlay covers the whole screen.

This pass implements local shortcut selection, a Start launcher, the taskbar tray, and workstation dialogs. Selected destinations show an explicit unconnected placeholder; records, authentication, fabricated metrics, and full window management are outside scope. Shortcuts support single-click, touch, and keyboard activation. Escape closes the active placeholder, launcher, or Settings dialog.

Navigation and icon decisions from the redesign request:

- **My PC** is the workstation container. Its computer glyph is never drawn on top of a folder, and **System** is nested inside it instead of sitting on the desktop. Opening System shows `DESKTOP / MY PC / SYSTEM` and a **Back to My PC** track, following the constrained-terminal breadcrumb in DESIGN.md.
- Every destination uses supplied Windows 98 artwork: My PC the workstation, Archive the open file cabinet, Organizations the old Network icon, My Documents the closed folder, Inbox the sealed envelope, CIRCA Word (renamed from `WRITE.exe`) the write-file document, Search the search bitmap, and System the console prompt shown inside My PC.
- **Archive** and **_EXPUNGED** carry the Windows 98 `.lnk` shortcut marker in the lower-left corner. The marker is decorative: no filesystem linking behavior is implied.
- Shortcut art renders at 48 CSS pixels from the Win98 bitmaps with nearest-neighbour scaling, then dulls toward the workstation's grey-blue with a per-pixel CSS filter (`saturate(.4) brightness(.85)`, 88% opacity). Two constraints keep it honest: the filter is applied to the bitmap element rather than as a blended overlay, because the PNGs are transparent and an overlay paints a visible tile behind each icon; and it desaturates without shifting hue, because a sepia or hue-rotate chain turned the globe's greens magenta. Labels sit directly on the wallpaper with a four-way text outline instead of the previous filled plate, so the emblem reads through.
- Desktop reading order is fixed as My PC, My Documents, Archive, Organizations, Inbox, CIRCA Word, Search, _EXPUNGED, Recycle Bin: workstation containers first, then the editor, then the archive tools. The editor keeps its place between Inbox and Search rather than being pushed to the end.
- The taskbar follows the reference arrangement: Start, then an organisation-flavoured status line reading `CIRCA/OS · REGISTERED TO THE ARCHIVE` in place of the reference build's activation notice, then **Settings** as a wide task-button item, with the notification bell sitting in the tray directly beside the UTC clock. Settings presses into its sunken state while its dialog is open. Notifications open an honest unconnected panel; **Settings** hosts the CRT screen filter, which replaced the old taskbar CRT button. The screen filter remains on by default.

## Verification

Run `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run test:e2e` from `client/`.

## Visual contract

Reading this as an archive workstation for fictional CIRCA analysts, in a restrained early desktop visual language. ENERGY 2 / RHYTHM 1 / MOTION 1. The supplied reference and project design provide direction; antislop-ui and UI Taste guide implementation and review.

- The navy/steel palette and local DM Sans preserve the existing institutional identity; IBM Plex Mono is reserved for the real UTC clock.
- A single left-aligned shortcut rail (two columns on narrow screens) leaves desktop space for the emblem; shared bitmap artwork plus the shortcut marker distinguishes destinations without decorative emoji.
- The emblem remains the focal point and is no longer dimmed. Icon artwork is desaturated toward the shell's grey-blue so it reads against the photograph instead of competing with it.
- A muted amber Start mark identifies the launcher. No fabricated telemetry, notifications, clearance, or account data is displayed; the notification panel states that delivery is not connected.
- Scanlines and a faint edge vignette simulate the requested screen surface. The Settings checkbox toggles the overlay, which never intercepts input and has no animation.
- On narrow screens, the icon rail uses two columns with 44px taskbar targets, and secondary chrome collapses. Short viewports allow icon scrolling.
- Modal folder placeholders provide focus management, Escape dismissal, and focus return. No network requests means loading and server-error states are not applicable yet.

Finish condition: verify all shortcuts, Start, the tray controls, modal dismissal/focus, CRT toggle, and overflow at desktop, reference-size, and mobile viewports; inspect the resulting screenshots.
