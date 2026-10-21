# Windows 98 icon set

## Responsibility

Desktop shortcut and file-browser artwork for the CIRCA/OS shell. Files are the original Windows 98 32px/48px bitmaps, kept as PNGs so the 1998 pixel grid survives untouched. `../../src/components/desktop-icons.tsx` maps each desktop destination to a file here; `../../src/components/files/files-index.ts` maps file extensions and folders.

## Structure

| File                              | Destination                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `computer-4.png`                  | My PC (48px)                                                                |
| `directory_open_cabinet_fc-2.png` | Archive                                                                     |
| `world-0.png`                     | Organizations, the old Network icon                                         |
| `directory_closed-0.png`          | My Records                                                                  |
| `envelope_closed-0.png`           | Inbox folder inside the mail client                                         |
| `outlook_express-1.png`           | Inbox on the desktop rail and the mail taskbar entry: the client's own mark |
| `write_file-1.png`                | CIRCA Word                                                                  |
| `search_web-0.png`                | Search                                                                      |
| `erase_file-0.png`                | _EXPUNGED                                                                   |
| `console_prompt-0.png`            | System, shown inside My PC                                                  |
| `help_question_mark-0.png`        | Help row inside the System window                                           |
| `recycle_bin_empty-4.png`         | Recycle Bin (48px)                                                          |
| `overlay_shortcut-2.png`          | `.lnk` marker layered over Archive and _EXPUNGED (48px)                     |
| `envelope_open_sheet-0.png`       | Outbox folder inside the mail client                                        |
| `registration-0.png`              | Drafts folder inside the mail client                                        |
| `message_file-0.png`              | Sent Items folder: a message that has been filed                            |
| `msg_error-0.png`                 | Dead Letters folder: mail the relay returned                                |
| `directory_open_cool-0.png`       | An open folder in the file browser's tree pane                              |
| `hard_disk_drive-2.png`           | The mounted volume `C: [SYSTEM]` (48px)                                     |
| `document-0.png`                  | `.pdf` records and case briefs                                              |
| `file_lines-0.png`                | `.txt` notes, rumours, and drafts                                           |
| `message_envelope_open-0.png`     | `.eml` filed correspondence                                                 |
| `image_old_jpeg-0.png`            | `.jpg` and `.png` evidence                                                  |
| `media_player_file-0.png`         | `.wav` audio evidence                                                       |
| `file_gears-0.png`                | `.bat`, `.sys`, and `.spl` system files                                     |
| `file_padlock.png`                | `.key` key material                                                         |
| `file_question.png`               | `.bin` unreadable sectors                                                   |
| `help_book_big-0.png`             | `.hlp` System Files help                                                    |
| `notepad-2.png`                   | The My Work folder (48px)                                                   |

The mail client's read and unread marks, the browser's and explorer's toolbar glyphs, and the tree twisties stay Lucide line glyphs rather than bitmaps: they render at 12 to 16px, which is at or below the pixel grid's usable range, so a downscaled bitmap loses the shape a hairline keeps. Toolbar glyphs also have to invert on a pressed state, which a fixed bitmap cannot do.

## Boundaries and usage

Reference files by root URL, for example `/icons/computer-4.png`. Assets render at 32 CSS pixels with `image-rendering: pixelated`; the 48px files are the ones intended for the larger shortcut marker and container icons. The shell dulls chrome artwork toward the workstation's grey-blue with a per-pixel CSS filter (`saturate(.4) brightness(.85)`) rather than editing the bitmaps, so these files stay exactly as downloaded. File listings and folder trees do not: file-type artwork is drawn in full colour, because it is the only thing that tells a record from a photograph once the names are off screen. Do not rename or re-encode them; see [third-party notices](../../THIRD_PARTY_NOTICES.md) for provenance before redistributing.
