"use client";

import type { Handlers } from "mdast-util-to-hast";
import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { normaliseTableRedactions } from "@/lib/markdown/normalise-redactions";
import { RECORD_REMARK_PLUGINS } from "@/lib/markdown/pipeline";
import type { RedactionMode } from "@/lib/markdown/types";
import { PaperFigure } from "./paper-figure";
import { PaperRedaction } from "./paper-redaction";
import { RecordImage } from "./record-image";

/**
 * A record's Markdown, rendered onto the sheet.
 *
 * This is the on-screen target. It shares the parse layer with every export:
 * the same plugin list, the same pre-parse table repair, the same nodes. What
 * it adds is only presentation — a redaction you can open, a figure that
 * floats, and the two handlers below that turn our own nodes into elements
 * rather than letting the default handler turn them into `<div>`s.
 *
 * Raw HTML is deliberately not enabled. `react-markdown` drops an `html` node
 * unless `rehype-raw` is added, so the syntax legend at the foot of the corpus
 * is inert, and a `<script>` written into a record is text with no execution.
 * Turning `rehype-raw` on would make both of those live, which is why it is
 * named in the plan as a thing not to add.
 */

/*
 * The default handler for an unknown node emits a `<div>`. Inside a paragraph
 * that is a block element in an inline slot, which the browser silently
 * restructures — the plan's verified trap. So `redaction` and `figure` are
 * handled explicitly, and `yaml` is handled as nothing at all in case a record
 * reaches the viewer with its header still attached.
 */
function recordHandlers(mode: RedactionMode = "labelled"): Handlers {
  return {
    yaml() {
      return undefined;
    },
    redaction(state, node) {
      // In `hidden` mode the withheld words never enter the tree, let alone the DOM.
      const children = mode === "hidden" ? [] : state.all(node);
      return {
        type: "element",
        tagName: "mark",
        properties: { className: ["reader-redaction-inline"] },
        children,
      };
    },
    figure(state, node) {
      void state;
      const align = node.align === "left" || node.align === "right" ? node.align : "full";
      return {
        type: "element",
        tagName: "figure",
        properties: { className: ["reader-figure", `reader-figure-${align}`] },
        children: [
          {
            type: "element",
            tagName: "img",
            properties: {
              src: node.url,
              alt: node.caption,
              ...(node.title ? { title: node.title } : {}),
            },
            children: [],
          },
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: node.caption }],
          },
        ],
      };
    },
  };
}

const COMPONENTS: Components = {
  mark: ({ children }) => <PaperRedaction>{children}</PaperRedaction>,
  figure: ({ className, children }) => <PaperFigure className={className}>{children}</PaperFigure>,
  img: RecordImage,
};

export function RecordMarkdown({ source, redactionMode = "labelled" }: {
  source: string;
  /** Policy, not styling: `hidden` leaves a redaction with nothing to reveal. */
  redactionMode?: RedactionMode;
}) {
  const handlers = useMemo(() => recordHandlers(redactionMode), [redactionMode]);
  // The repair has to run on the string, before `react-markdown` parses it.
  const normalised = useMemo(() => normaliseTableRedactions(source), [source]);
  return (
    <div className="reader-markdown">
      <ReactMarkdown
        remarkPlugins={RECORD_REMARK_PLUGINS}
        remarkRehypeOptions={{ handlers }}
        components={COMPONENTS}
        skipHtml
      >
        {normalised}
      </ReactMarkdown>
    </div>
  );
}
