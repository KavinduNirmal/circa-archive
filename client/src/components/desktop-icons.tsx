import { Bell, Cog } from "lucide-react";
import Image from "next/image";
import type { ComponentProps } from "react";

/**
 * Desktop shortcut icons.
 *
 * Artwork is the Windows 98 icon set in `public/icons`, supplied as PNGs so the
 * bitmaps stay true to the 1998 32px grid. Every destination names a file, so a
 * missing file is a content bug rather than a silent visual gap.
 *
 * Icons render at 32 CSS pixels with `image-rendering: pixelated`, keeping the
 * 32px assets 1:1 and the 48px assets crisply downsampled. Only the app window
 * chrome dulls them (`.window-*` and the folder rail); the file listings draw
 * the same files in full colour, because file-type artwork is what tells a
 * record from evidence once the names are off screen.
 */
const ICON_SIZE = 32;

const icons = {
  "my-pc": { asset: "/icons/computer-4.png" },
  archive: { asset: "/icons/directory_open_cabinet_fc-2.png", shortcut: true },
  organizations: { asset: "/icons/world-0.png" },
  records: { asset: "/icons/directory_closed-0.png" },
  "records-work": { asset: "/icons/notepad-2.png" },
  files: { asset: "/icons/directory_open_cool-0.png" },
  inbox: { asset: "/icons/outlook_express-1.png" },
  "circa-word": { asset: "/icons/write_file-1.png" },
  search: { asset: "/icons/search_web-0.png" },
  expunged: { asset: "/icons/erase_file-0.png", shortcut: true },
  system: { asset: "/icons/console_prompt-0.png" },
  help: { asset: "/icons/help_question_mark-0.png" },
  recycle: { asset: "/icons/recycle_bin_empty-4.png" },
  // Worn by the Start menu's exit to the public landing page, which is not a folder.
  public: { asset: "/icons/help_book_big-0.png" },
  // The record reader's own window, which no shortcut opens: a record opens it.
  reader: { asset: "/icons/file_lines-0.png" },
} as const satisfies Record<string, { asset: string; shortcut?: boolean }>;

export type IconGlyph = keyof typeof icons;

/** Tray glyphs, exported so the taskbar owns its own control mapping. */
export const notificationGlyph = Bell;
export const settingsGlyph = Cog;

/** Retro shortcut marker stamped on `.lnk`-style desktop shortcuts. */
export const SHORTCUT_OVERLAY = "/icons/overlay_shortcut-2.png";

export type DesktopIconSpec = { glyph: IconGlyph; shortcut?: boolean };

/**
 * Renders one shortcut icon and, when requested, overlays the Windows 98
 * shortcut marker in the lower-left corner like a `.lnk` file.
 */
export function DesktopIcon({
  icon,
  className,
  ...props
}: { icon: DesktopIconSpec; className?: string } & ComponentProps<"span">) {
  const entry = icons[icon.glyph];
  return (
    <span
      className={["desktop-icon", className].filter(Boolean).join(" ")}
      data-icon={icon.glyph}
      data-shortcut={icon.shortcut ? "true" : undefined}
      {...props}
    >
      <Bitmap
        src={entry.asset}
        className="desktop-icon-glyph"
        size={ICON_SIZE}
      />
      {icon.shortcut && (
        <Bitmap src={SHORTCUT_OVERLAY} className="desktop-icon-shortcut" />
      )}
    </span>
  );
}

/**
 * Bitmap element for icon artwork. The image still goes through `next/image`,
 * but optimisation is off: these assets are already tiny, and re-encoding them
 * would defeat the nearest-neighbour scaling the 1998 pixel grid relies on.
 */
function Bitmap({
  src,
  className,
  size = 32,
}: {
  src: string;
  className: string;
  size?: number;
}) {
  return (
    <Image
      className={className}
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      unoptimized
    />
  );
}
