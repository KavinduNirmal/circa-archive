import { existsSync } from "node:fs";
import { join } from "node:path";
import { toHast, type Handlers } from "mdast-util-to-hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useLocale } from "next-intl";
import { useId } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { parseRecord } from "@/lib/markdown/pipeline";
import { RecordImage } from "../reader/record-image";
import styles from "./archive-site.module.css";

/**
 * A record's prose, rendered on the server into plain HTML.
 *
 * The workstation's viewer is the interactive target: its redactions open on
 * click, so that renderer has to be a client component. This one is the reading
 * edition, and it is deliberately not. It runs the same parse — the same plugin
 * list, the same pre-parse table repair, the same nodes — and turns the tree
 * into elements here, so a page of the public archive carries no Markdown
 * parser and no state. (The annotations composer is the page's one client
 * island; it is not this.)
 *
 * Two affordances survive without a script. A redaction becomes a checkbox and
 * its label, so the withheld words are still behind a deliberate act, it stays
 * inside the paragraph the author wrote, and it works with a keyboard and a
 * screen reader. A figure whose image the archive does not hold is drawn as a
 * plate rather than as a broken image: the corpus references three photographs
 * that were never supplied, and a page that pretends otherwise shows three torn
 * icons.
 */

/** Is this image actually in `public/`? Remote sources are assumed to be held. */
function imageHeld(url: string): boolean {
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:")) return true;
  const path = url.replace(/^\.?\//, "");
  return existsSync(join(process.cwd(), "public", path));
}

function proseHandlers(
  redactionLabel: string,
  imageNotHeld: string,
  locale: string,
  uid: string,
): Handlers {
  let redactions = 0;
  return {
    // Raw HTML is dropped exactly as the viewer drops it: a record is text, and
    // a script written into one is not a script.
    html() {
      return undefined;
    },
    /*
     * A citation inside a filing is authorised against the site, not the
     * document: the corpus names another record as `/site/records/INC-00907`,
     * and the Markdown cannot know which language it is being read in. The
     * prefix is added here so a Korean reader stays in Korean, and any other
     * href — an external copy, an in-page anchor — is left alone.
     */
    link(state, node) {
      const href = node.url.startsWith("/site/")
        ? `/${locale}${node.url}`
        : node.url;
      return {
        type: "element",
        tagName: "a",
        properties: { href, ...(node.title ? { title: node.title } : {}) },
        children: state.all(node),
      };
    },
    /*
     * A redaction is a checkbox, not a `<details>`.
     *
     * The withheld word sits inside a paragraph, and `<details>` is not phrasing
     * content: a browser parsing `<p>…<details>…</details>…</p>` closes the
     * paragraph before it, so the server's HTML and the client's tree disagree
     * and the whole page fails to hydrate. A checkbox, its `<label>`, and a
     * `<span>` are all inline, so the mark stays where the author put it, needs
     * no script, and is still opened by a deliberate act with a keyboard or a
     * click.
     */
    redaction(state, node) {
      redactions += 1;
      const id = `${uid}-redaction-${redactions}`;
      return {
        type: "element",
        tagName: "span",
        properties: { className: [styles.redaction] },
        children: [
          {
            type: "element",
            tagName: "input",
            properties: {
              type: "checkbox",
              id,
              className: [styles.redactionToggle],
            },
            children: [],
          },
          {
            type: "element",
            tagName: "label",
            properties: { htmlFor: [id], className: [styles.redactionLabel] },
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
      const align =
        node.align === "left" || node.align === "right" ? node.align : "full";
      const held = imageHeld(node.url);
      return {
        type: "element",
        tagName: "figure",
        properties: {
          className: [
            styles.figure,
            styles[`figure${align[0].toUpperCase()}${align.slice(1)}`],
          ],
        },
        children: [
          held
            ? {
                type: "element",
                tagName: "img",
                properties: {
                  src: node.url,
                  alt: node.caption,
                  loading: "lazy",
                  ...(node.title ? { title: node.title } : {}),
                },
                children: [],
              }
            : {
                type: "element",
                tagName: "div",
                properties: {
                  className: [styles.figureHeld],
                  role: "img",
                  ariaLabel: imageNotHeld,
                },
                children: [{ type: "text", value: "×" }],
              },
          {
            type: "element",
            tagName: "figcaption",
            properties: { className: [styles.figureCaption] },
            children: [
              {
                type: "text",
                value: `${held ? "" : `${imageNotHeld}. `}${node.caption}`,
              },
            ],
          },
        ],
      };
    },
  };
}

export function RecordProse({
  source,
  redactionLabel,
  imageNotHeld,
}: {
  source: string;
  redactionLabel: string;
  imageNotHeld: string;
}) {
  const locale = useLocale();
  // React's own id keeps every redaction's checkbox unique across the page's
  // sections, so a label opens the mark it was drawn for and nothing else.
  const uid = useId();
  const { output } = parseRecord({ markdown: source });
  const tree = toHast(output, {
    handlers: proseHandlers(redactionLabel, imageNotHeld, locale, uid),
  });
  if (!tree) return null;
  return (
    <div className={styles.prose}>
      {toJsxRuntime(tree, {
        Fragment,
        jsx,
        jsxs,
        development: false,
        components: { img: RecordImage },
      })}
    </div>
  );
}
