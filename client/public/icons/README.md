# Windows 98 icon set

## Responsibility

Desktop shortcut artwork for the CIRCA/OS shell. Files are the original Windows 98 32px/48px bitmaps, kept as PNGs so the 1998 pixel grid survives untouched. `../../src/components/desktop-icons.tsx` maps each destination to a file here.

## Structure

| File | Destination |
| --- | --- |
| `computer-4.png` | My PC (48px) |
| `directory_open_cabinet_fc-2.png` | Archive |
| `world-0.png` | Organizations, the old Network icon |
| `directory_closed-0.png` | My Records |
| `envelope_closed-0.png` | Inbox |
| `write_file-1.png` | CIRCA Word |
| `search_web-0.png` | Search |
| `erase_file-0.png` | _EXPUNGED |
| `console_prompt-0.png` | System, shown inside My PC |
| `help_question_mark-0.png` | Help row inside the System window |
| `recycle_bin_empty-4.png` | Recycle Bin (48px) |
| `overlay_shortcut-2.png` | `.lnk` marker layered over Archive and _EXPUNGED (48px) |
| `outlook_express-1.png` | Supplied for the mail client; not yet wired to a surface |

## Boundaries and usage

Reference files by root URL, for example `/icons/computer-4.png`. Assets render at 32 CSS pixels with `image-rendering: pixelated`; the 48px files are the ones intended for the larger shortcut marker and container icons. The shell dulls them toward the workstation's grey-blue with a per-pixel CSS filter (`saturate(.4) brightness(.85)`) rather than editing the bitmaps, so these files stay exactly as downloaded. Do not rename or re-encode them; see [third-party notices](../../THIRD_PARTY_NOTICES.md) for provenance before redistributing.
