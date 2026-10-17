import { existsSync } from "node:fs";
import { join } from "node:path";
import { toHast, type Handlers } from "mdast-util-to-hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { parseRecord } from "@/lib/markdown/pipeline";
import styles from "./archive-site.module.css";

/**
 * A record's prose, rendered on the server into plain HTML.
 *
 * The workstation's viewer is the interactive target: its redactions open on
 * click, so that renderer has to be a client component. This one is the reading
 * edition, and it is deliberately not. It runs the same parse — the same plugin
 * list, the same pre-parse table repair, the same nodes — and turns the tree
 * into elements here, so a page of the public archive carries no Markdown
 * parser, no state, and no client JavaScript at all.
 *
 * Two affordances survive without a script. A redaction becomes a native
 * `<details>`, so the withheld words are still behind a deliberate act, and it
 * still works with a keyboard and a screen reader. A figure whose image the
 * archive does not hold is drawn as a plate rather than as a broken image: the
 * corpus references three photographs that were never supplied, and a page that
 * pretends otherwise shows three torn icons.
 */

/** Is this image actually in `public/`? Remote sources are assumed to be held. */
function imageHeld(url: string): boolean {
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:")) return true;
  const path = url.replace(/^\.?\//, "");
  return existsSync(join(process.cwd(), "public", path));
}

function proseHandlers(redactionLabel: string, imageNotHeld: string): Handlers {
  return {
    // Raw HTML is dropped exactly as the viewer drops it: a record is text, and
    // a script written into one is not a script.
    html() {
      return undefined;
    },
    redaction(state, node) {
      return {
        type: "element",
        tagName: "details",
        properties: { className: [styles.redaction] },
        children: [
          {
            type: "element",
            tagName: "summary",
            properties: { className: [styles.redactionOpen] },
            children: [{ type: "text", value: redactionLabel }],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: [styles.redactionText] },
            children: state.all(node),
          },
        ],
      };
    },
    figure(state, node) {
      void state;
      const align = node.align === "left" || node.align === "right" ? node.align : "full";
      const held = imageHeld(node.url);
      return {
        type: "element",
        tagName: "figure",
        properties: { className: [styles.figure, styles[`figure${align[0].toUpperCase()}${align.slice(1)}`]] },
        children: [
          held
            ? {
                type: "element",
                tagName: "img",
                properties: { src: node.url, alt: node.caption, loading: "lazy", ...(node.title ? { title: node.title } : {}) },
                children: [],
              }
            : {
                type: "element",
                tagName: "div",
                properties: { className: [styles.figureHeld], role: "img", ariaLabel: imageNotHeld },
                children: [{ type: "text", value: "×" }],
              },
          {
            type: "element",
            tagName: "figcaption",
            properties: { className: [styles.figureCaption] },
            children: [{ type: "text", value: `${held ? "" : `${imageNotHeld}. `}${node.caption}` }],
          },
        ],
      };
    },
  };
}

export function RecordProse({ source, redactionLabel, imageNotHeld }: {
  source: string;
  redactionLabel: string;
  imageNotHeld: string;
}) {
  const { output } = parseRecord({ markdown: source });
  const tree = toHast(output, { handlers: proseHandlers(redactionLabel, imageNotHeld) });
  if (!tree) return null;
  return (
    <div className={styles.prose}>
      {toJsxRuntime(tree, { Fragment, jsx, jsxs, development: false })}
    </div>
  );
}
