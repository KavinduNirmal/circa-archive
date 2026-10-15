import type { PhrasingContent } from "mdast";
import type { Position } from "unist";

/*
 * The two nodes this renderer adds to mdast.
 *
 * `redaction` is a phrasing node, so it is legal anywhere a word is: inside a
 * paragraph, a heading, a table cell, or an emphasis run. `figure` is a flow
 * node, because it is a block with a caption rather than an image in a line.
 * Both are registered on mdast's own maps so the transforms, the emitters, and
 * the React viewer all agree on what the document contains.
 */
declare module "mdast" {
  interface PhrasingContentMap {
    redaction: Redaction;
  }
  interface RootContentMap {
    redaction: Redaction;
    figure: Figure;
  }
}

/** A span whose text the archive has withheld. */
export type Redaction = {
  type: "redaction";
  children: PhrasingContent[];
  position?: Position;
};

export type FigureAlign = "left" | "right" | "full";

/** An image with an alignment and a caption, taken from its alt directive. */
export type Figure = {
  type: "figure";
  /** Absolute or document-relative source, already resolved against the asset base. */
  url: string;
  /** The alt text with the alignment prefix removed; the accessible name. */
  caption: string;
  align: FigureAlign;
  title?: string | null;
  position?: Position;
};

/**
 * How a redaction is presented. This is policy, not styling: `hidden` never
 * emits the withheld text at all, which is the only safe mode for an export.
 */
export type RedactionMode = "hidden" | "labelled" | "visible";

/** Everything the renderer is allowed to depend on. No React and no DOM. */
export type RenderInput = {
  /** The raw record: YAML frontmatter followed by the Markdown body. */
  markdown: string;
  /**
   * Absolute origin for relative image paths such as `./evidence/door.jpg`.
   * Omitted, the paths stay relative, which is what the on-screen viewer wants.
   */
  assetBaseUrl?: string;
  /** Defaults to `labelled`, the on-screen reading mode. */
  redactionMode?: RedactionMode;
  /**
   * Runs the pre-parse table repair. Only `false` is useful, and only to a test
   * that means to show what the parser does without it.
   */
  normalise?: boolean;
};

export type RenderWarningCode =
  /** An odd number of `||` in one run, so one delimiter has no partner. */
  | "unmatched-redaction"
  /** An alignment word that is not `left`, `right`, or `full`. */
  | "unknown-image-align"
  /** A relative image path with no asset base to hang it on. */
  | "relative-image"
  /** The record carries no YAML block, so the chrome has nothing to read. */
  | "metadata-field-missing"
  /** The header and the body disagree about a field. The fiction expects this. */
  | "metadata-disagreement";

export type RenderWarning = {
  code: RenderWarningCode;
  message: string;
  /** The source line the warning points at, when the node carries a position. */
  line?: number;
};

export type RenderResult<T> = { output: T; warnings: RenderWarning[] };

/** The frontmatter, as parsed YAML. Empty when the record has none. */
export type RecordMetadata = Record<string, unknown>;

/** A parsed record: the tree every emitter shares, plus what the header said. */
export type ParsedRecord = {
  output: import("mdast").Root;
  metadata: RecordMetadata;
  warnings: RenderWarning[];
};
