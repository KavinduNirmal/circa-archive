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
| `envelope_closed-0.png` | Inbox folder inside the mail client |
| `outlook_express-1.png` | Inbox on the desktop rail and the mail taskbar entry: the client's own mark |
| `write_file-1.png` | CIRCA Word |
| `search_web-0.png` | Search |
| `erase_file-0.png` | _EXPUNGED |
| `console_prompt-0.png` | System, shown inside My PC |
| `help_question_mark-0.png` | Help row inside the System window |
| `recycle_bin_empty-4.png` | Recycle Bin (48px) |
| `overlay_shortcut-2.png` | `.lnk` marker layered over Archive and _EXPUNGED (48px) |
| `envelope_open_sheet-0.png` | Outbox folder inside the mail client |
| `registration-0.png` | Drafts folder inside the mail client |
| `message_file-0.png` | Sent Items folder: a message that has been filed |
| `msg_error-0.png` | Dead Letters folder: mail the relay returned |

The mail client's read and unread marks stay Lucide line glyphs rather than bitmaps: they render at 12px, which is below the pixel grid's usable range, so a downscaled bitmap loses the shape a hairline keeps.

## Boundaries and usage

Reference files by root URL, for example `/icons/computer-4.png`. Assets render at 32 CSS pixels with `image-rendering: pixelated`; the 48px files are the ones intended for the larger shortcut marker and container icons. The shell dulls them toward the workstation's grey-blue with a per-pixel CSS filter (`saturate(.4) brightness(.85)`) rather than editing the bitmaps, so these files stay exactly as downloaded. Do not rename or re-encode them; see [third-party notices](../../THIRD_PARTY_NOTICES.md) for provenance before redistributing.
