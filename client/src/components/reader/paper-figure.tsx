import type { ReactNode } from "react";

/**
 * A figure on the sheet: an image, a caption, and the alignment its directive
 * asked for.
 *
 * Alignment is carried in the class list rather than as a style, so the three
 * cases are three rules in `globals.css` and the float can be dropped in one
 * place when the sheet is printed. `full` is not a fourth kind of float: it is
 * the absence of one, and the width a figure falls back to.
 */
export function PaperFigure({ className, children }: { className?: string; children?: ReactNode }) {
  const align = className?.includes("reader-figure-right")
    ? "right"
    : className?.includes("reader-figure-left")
      ? "left"
      : "full";
  return (
    <figure className={className} data-align={align}>
      {children}
    </figure>
  );
}
