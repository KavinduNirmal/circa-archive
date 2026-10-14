/**
 * The editor's document model.
 *
 * Every toolbar action is a pure function from text plus selection to new text
 * plus new selection, so the whole editor is testable without a renderer and the
 * text area only ever holds the string. Nothing here re-renders Markdown: the
 * record's `.pdf` is the reader's job, and turning the document into a preview
 * would be a second renderer to keep in step with the first.
 */

import type { TextSize } from "./word-identity";

/** A caret or a selection, in code-unit offsets. */
export type TextSelection = { start: number; end: number };

/** Which markdown tool a control stands for. */
export type MarkdownToolId =
  | "bold" | "italic" | "strike" | "code"
  | "heading1" | "heading2" | "heading3"
  | "bullets" | "numbers" | "quote" | "codeblock"
  | "link" | "image" | "table" | "rule" | "clear";

export type MarkdownTool = {
  id: MarkdownToolId;
  /** What the button prints. Typographic marks rather than icons, the way a 1999 format bar read. */
  label: string;
  /** Plain-language name, used as the accessible label. */
  name: string;
  /** The markdown that gets written, shown on hover so the syntax is never a surprise. */
  syntax: string;
  /** Toolbar group. */
  group: "text" | "blocks";
};

/*
 * The markdown-specific tools, in toolbar order.
 *
 * Each one is either inline markup that wraps a selection or a block marker that
 * prefixes or fences the lines the selection touches, which is the whole of what
 * a writer needs before the filing metadata exists.
 */
export const MARKDOWN_TOOLS: readonly MarkdownTool[] = [
  { id: "bold", label: "B", name: "Bold", syntax: "**bold**", group: "text" },
  { id: "italic", label: "I", name: "Italic", syntax: "*italic*", group: "text" },
  { id: "strike", label: "S", name: "Strikethrough", syntax: "~~struck~~", group: "text" },
  { id: "code", label: "<>", name: "Inline code", syntax: "`code`", group: "text" },
  { id: "heading1", label: "H1", name: "Heading 1", syntax: "# Heading", group: "text" },
  { id: "heading2", label: "H2", name: "Heading 2", syntax: "## Heading", group: "text" },
  { id: "heading3", label: "H3", name: "Heading 3", syntax: "### Heading", group: "text" },
  { id: "bullets", label: "\u2022", name: "Bulleted list", syntax: "- item", group: "blocks" },
  { id: "numbers", label: "1.", name: "Numbered list", syntax: "1. item", group: "blocks" },
  { id: "quote", label: "\u00b6", name: "Blockquote", syntax: "> quoted", group: "blocks" },
  { id: "codeblock", label: "{ }", name: "Code block", syntax: "```", group: "blocks" },
  { id: "link", label: "\u2197", name: "Link", syntax: "[text](address)", group: "blocks" },
  { id: "image", label: "\u25a3", name: "Image", syntax: "![alt](address)", group: "blocks" },
  { id: "table", label: "\u229e", name: "Table", syntax: "| a | b |", group: "blocks" },
  { id: "rule", label: "\u2014", name: "Horizontal rule", syntax: "---", group: "blocks" },
  { id: "clear", label: "\u232b", name: "Clear formatting", syntax: "plain text", group: "blocks" },
];

export function findTool(id: string): MarkdownTool | undefined {
  return MARKDOWN_TOOLS.find((tool) => tool.id === id);
}

/** What the status bar says after a tool runs. */
export const CHANGE_LABELS: Record<MarkdownToolId, string> = {
  bold: "Bold applied",
  italic: "Italic applied",
  strike: "Strikethrough applied",
  code: "Inline code applied",
  heading1: "Heading 1 applied",
  heading2: "Heading 2 applied",
  heading3: "Heading 3 applied",
  bullets: "Bulleted list applied",
  numbers: "Numbered list applied",
  quote: "Blockquote applied",
  codeblock: "Code block inserted",
  link: "Link inserted",
  image: "Image inserted",
  table: "Table inserted",
  rule: "Horizontal rule inserted",
  clear: "Formatting cleared",
};

/**
 * The tools whose state the toolbar reports from the caret alone.
 *
 * The list is explicit rather than derived because detection is not uniform: the
 * block markers are read from the caret's line, the inline markers from the run
 * around the caret, and the code fence from counting fences above it. A tool
 * that is not here has no pressed state to show.
 */
export const ACTIVE_LABELS: readonly MarkdownToolId[] = [
  "bold", "italic", "strike", "code",
  "heading1", "heading2", "heading3",
  "bullets", "numbers", "quote", "codeblock",
];

/** The inline markers, as pairs. */
const INLINE: readonly { id: MarkdownToolId; marker: string }[] = [
  { id: "bold", marker: "**" },
  { id: "italic", marker: "*" },
  { id: "strike", marker: "~~" },
  { id: "code", marker: "`" },
];

/** The line markers, longest first so `###` is never read as `#`. */
const LINE: readonly { id: MarkdownToolId; marker: string }[] = [
  { id: "heading3", marker: "### " },
  { id: "heading2", marker: "## " },
  { id: "heading1", marker: "# " },
  { id: "bullets", marker: "- " },
  { id: "numbers", marker: "1. " },
  { id: "quote", marker: "> " },
];

/* ------------------------------------------------------------------------- */
/* Applying a tool                                                            */
/* ------------------------------------------------------------------------- */

export type MarkdownChange = {
  tool: MarkdownToolId;
  selection: TextSelection;
  /** The address a link or an image was given, when the dialog supplied one. */
  address?: string;
};

export type MarkdownResult = { text: string; selection: TextSelection };

/** A selection clamped to the text, with its ends in order. */
function clampSelection(text: string, selection: TextSelection): TextSelection {
  const start = Math.max(0, Math.min(selection.start, selection.end, text.length));
  const end = Math.max(0, Math.min(Math.max(selection.start, selection.end), text.length));
  return { start, end };
}

/** Character offsets of the line containing `position`, excluding its newline. */
function lineBoundsAt(text: string, position: number): { start: number; end: number } {
  const start = text.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  const nextBreak = text.indexOf("\n", position);
  return { start, end: nextBreak === -1 ? text.length : nextBreak };
}

/**
 * Every line a selection touches, clamped to the text.
 *
 * A selection that ends exactly on a line start does not include that line, which
 * is what stops a numbered list from numbering the empty line after it.
 */
function selectedLines(text: string, selection: TextSelection): { start: number; end: number }[] {
  const { start, end } = clampSelection(text, selection);
  const lines: { start: number; end: number }[] = [];
  let cursor = lineBoundsAt(text, start).start;
  while (cursor < end) {
    const bounds = lineBoundsAt(text, cursor);
    lines.push(bounds);
    if (bounds.end >= text.length) break;
    cursor = bounds.end + 1;
  }
  // A caret on an empty line still has one line to act on.
  if (lines.length === 0) lines.push(lineBoundsAt(text, Math.min(start, text.length)));
  return lines;
}

/**
 * Where the markers around a selection are, if they are there.
 *
 * The markers can be inside the selection or just outside it. Both are the same
 * edit to a writer, so both count as a wrapped run and the tool unwraps it.
 */
function wrapOffsets(text: string, selection: TextSelection, marker: string): { outer: number; inner: number } | undefined {
  const { start, end } = selection;
  const inner = text.slice(start, end);
  if (inner.length >= marker.length * 2 && inner.startsWith(marker) && inner.endsWith(marker)) {
    return { outer: start, inner: end - start - marker.length * 2 };
  }
  if (text.slice(start - marker.length, start) === marker && text.slice(end, end + marker.length) === marker) {
    return { outer: start - marker.length, inner: end - start };
  }
  return undefined;
}

/** Wraps or unwraps an inline marker. */
function toggleInline(text: string, selection: TextSelection, marker: string): MarkdownResult {
  const { start, end } = selection;
  const wrapped = wrapOffsets(text, selection, marker);
  if (wrapped) {
    const content = text.slice(wrapped.outer + marker.length, wrapped.outer + marker.length + wrapped.inner);
    const next = text.slice(0, wrapped.outer) + content + text.slice(wrapped.outer + marker.length * 2 + wrapped.inner);
    return { text: next, selection: { start: wrapped.outer, end: wrapped.outer + wrapped.inner } };
  }
  if (end === start) {
    // Nothing selected: the markers go in and the caret lands between them, so
    // the next thing typed is marked up.
    const next = `${text.slice(0, start)}${marker}${marker}${text.slice(start)}`;
    return { text: next, selection: { start: start + marker.length, end: start + marker.length } };
  }
  const next = `${text.slice(0, start)}${marker}${text.slice(start, end)}${marker}${text.slice(end)}`;
  return { text: next, selection: { start: start + marker.length, end: end + marker.length } };
}

/** A line's heading markers, so a new level replaces the old one instead of stacking. */
function headingOf(line: string): string | undefined {
  return /^#{1,6}\s+/.exec(line)?.[0];
}

/**
 * Adds, replaces, or removes a line marker across the selected lines.
 *
 * Adding is the default. A line that already carries the marker loses it, and a
 * heading switches level rather than stacking a second marker, which is what
 * makes these buttons toggles rather than one-way doors.
 */
function toggleLine(text: string, selection: TextSelection, marker: string, isHeading: boolean): MarkdownResult {
  const lines = selectedLines(text, selection);
  const current = (line: { start: number; end: number }) => text.slice(line.start, line.end);
  const remove = lines.every((line) => current(line).startsWith(marker));

  const pieces = lines.map((line) => {
    const value = current(line);
    if (remove) return value.slice(marker.length);
    const existing = headingOf(value);
    if (existing) return isHeading ? marker + value.slice(existing.length) : value;
    return marker + value;
  });

  let next = "";
  let at = 0;
  let delta = 0;
  let firstDelta = 0;
  lines.forEach((line, index) => {
    next += text.slice(at, line.start) + pieces[index];
    at = line.end;
    const change = pieces[index].length - current(line).length;
    if (index === 0) firstDelta = change;
    delta += change;
  });
  next += text.slice(at);

  return {
    text: next,
    selection: { start: selection.start + firstDelta, end: selection.end + delta },
  };
}

/** Inserts a block of markdown on its own lines, replacing the selection. */
function insertBlock(text: string, selection: TextSelection, body: string): MarkdownResult {
  const { start, end } = clampSelection(text, selection);
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lead = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const tail = after.startsWith("\n") ? "\n" : "\n\n";
  const caret = start + lead.length + body.length;
  return { text: `${before}${lead}${body}${tail}${after}`, selection: { start: caret, end: caret } };
}

/**
 * Strips every marker the editor writes from the selected lines: the block
 * marker at the start of a line and the inline markers anywhere in it.
 */
function clearFormatting(text: string, selection: TextSelection): MarkdownResult {
  const lines = selectedLines(text, selection);
  const pieces = lines.map((line) => text.slice(line.start, line.end)
    .replace(/^(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s+|```.*$)/, "")
    .replace(/(\*\*|~~|`|\*)/g, ""));
  let next = "";
  let at = 0;
  let delta = 0;
  let firstDelta = 0;
  lines.forEach((line, index) => {
    next += text.slice(at, line.start) + pieces[index];
    at = line.end;
    const change = pieces[index].length - (line.end - line.start);
    if (index === 0) firstDelta = change;
    delta += change;
  });
  next += text.slice(at);
  return {
    text: next,
    selection: { start: selection.start + firstDelta, end: selection.end + delta },
  };
}

/** Applies one toolbar action and returns the document and where the caret belongs. */
export function applyChange(text: string, selection: TextSelection, tool: MarkdownToolId, address?: string): MarkdownResult;
export function applyChange(text: string, change: MarkdownChange): MarkdownResult;
export function applyChange(text: string, selectionOrChange: TextSelection | MarkdownChange, tool?: MarkdownToolId, address?: string): MarkdownResult {
  const change: MarkdownChange = "tool" in selectionOrChange
    ? selectionOrChange
    : { tool: tool as MarkdownToolId, selection: selectionOrChange, address };
  const clamped = clampSelection(text, change.selection);
  const { start, end } = clamped;
  const inner = text.slice(start, end);

  switch (change.tool) {
    case "bold":
    case "italic":
    case "strike":
    case "code":
      return toggleInline(text, clamped, INLINE.find((item) => item.id === change.tool)?.marker ?? "");
    case "heading1":
    case "heading2":
    case "heading3":
    case "bullets":
    case "numbers":
    case "quote":
      return toggleLine(text, clamped, LINE.find((item) => item.id === change.tool)?.marker ?? "", change.tool.startsWith("heading"));
    case "codeblock": {
      const caret = start + 4 + inner.length;
      return { text: `${text.slice(0, start)}\`\`\`\n${inner}\n\`\`\`${text.slice(end)}`, selection: { start: caret, end: caret } };
    }
    case "rule":
      return insertBlock(text, clamped, "---");
    case "table":
      return insertBlock(text, clamped, "| Column | Column |\n| --- | --- |\n| Cell | Cell |");
    case "link": {
      const label = inner || "text";
      const rendered = `[${label}](${change.address ?? ""})`;
      const caret = change.address ? start + rendered.length : start + label.length + 3;
      return { text: `${text.slice(0, start)}${rendered}${text.slice(end)}`, selection: { start: caret, end: caret } };
    }
    case "image": {
      const alt = inner || "alt text";
      const rendered = `![${alt}](${change.address ?? ""})`;
      const caret = change.address ? start + rendered.length : start + alt.length + 4;
      return { text: `${text.slice(0, start)}${rendered}${text.slice(end)}`, selection: { start: caret, end: caret } };
    }
    case "clear":
      return clearFormatting(text, clamped);
  }
}

/* ------------------------------------------------------------------------- */
/* Reading the document                                                       */
/* ------------------------------------------------------------------------- */

/**
 * Whether a caret sits inside a run wrapped in `marker`.
 *
 * Counting the marker characters in the span between a pair is what separates
 * the marker from the run inside it: for `*italic*`, the span past the first `*`
 * to the closing `*` contains no `*` at all, while for `**bold**` every `*` still
 * has another one before the closing marker. A caret drawn just after a closing
 * marker still counts as being in that run, which is what a writer expects.
 */
function isInsideMarker(text: string, position: number, marker: string): boolean {
  const opens = text.lastIndexOf(marker, position);
  if (opens === -1) return false;
  const closes = text.indexOf(marker, opens + marker.length);
  if (closes === -1) return false;
  if (closes + marker.length < position) return false;
  const between = text.slice(opens + marker.length, closes);
  return countMarkerRuns(between, marker) === 0;
}

/** Runs of exactly `marker`, ignoring the longer runs that contain it. */
function countMarkerRuns(text: string, marker: string): number {
  const size = marker.length;
  let runs = 0;
  let index = text.indexOf(marker);
  while (index !== -1) {
    const before = text[index - 1];
    const after = text[index + size];
    if (before !== marker[0] && after !== marker[0]) runs += 1;
    index = text.indexOf(marker, index + size);
  }
  return runs;
}

/** Which tools the caret is currently inside, for the toolbar's pressed state. */
export function detectActive(text: string, selection: TextSelection): MarkdownToolId[] {
  const position = Math.min(selection.start, text.length);
  const bounds = lineBoundsAt(text, position);
  const line = text.slice(bounds.start, bounds.end);
  const active: MarkdownToolId[] = [];

  for (const { id, marker } of LINE) {
    if (line.startsWith(marker)) active.push(id);
  }

  /*
   * The fence is read by counting fences above the caret rather than by looking
   * at the caret's line: every line inside a code block is in it, and none of
   * them carries a marker of its own.
   */
  const fences = text.slice(0, position).split("\n").filter((item) => item.trimStart().startsWith("```")).length;
  if (fences % 2 === 1) active.push("codeblock");

  for (const { id, marker } of INLINE) {
    if (isInsideMarker(text, position, marker)) active.push(id);
  }
  return active;
}

/** Whether the caret's line is a heading. The View menu's style box reports it. */
export function markupStyle(line: string): "body" | "heading" {
  return /^#{1,6}\s+/.test(line) ? "heading" : "body";
}

export type TextStats = { words: number; lines: number; characters: number; paragraphs: number };

/** What the status bar counts. An empty document has no lines, not one. */
export function textStats(text: string): TextStats {
  if (text.length === 0) return { words: 0, lines: 0, characters: 0, paragraphs: 0 };
  const words = text.split(/\s+/).filter((item) => item.length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter((item) => item.trim().length > 0).length;
  return { words, lines: text.split("\n").length, characters: text.length, paragraphs };
}

export function formatCounts(stats: TextStats): string {
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  return `${plural(stats.words, "word")}, ${plural(stats.lines, "line")}, ${plural(stats.characters, "character")}`;
}

export type { TextSize };
