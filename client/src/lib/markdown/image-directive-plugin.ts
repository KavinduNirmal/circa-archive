import type { Parents, Root } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import type { Figure, FigureAlign } from "./types";
import { warningBag } from "./validate";

/*
 * The alignment directive is ours, not Markdown's: CommonMark has no image
 * alignment and no caption. The convention is `![right|Figure 1. …](path)`,
 * which parses as an ordinary image whose alt text begins `right|`. This
 * transform is the only place that knows the convention, and it strips the
 * prefix from the caption in every target — the alt text is the image's
 * accessible name, so leaving `right|` in it would be an accessibility defect
 * and not merely an ugly one.
 *
 * A lone image in a paragraph becomes a `figure` in the paragraph's place.
 * Replacing the paragraph rather than the image keeps a block node out of a
 * paragraph, which is the same nesting rule the redaction handler has to obey.
 */

export type ImageDirectiveOptions = { assetBaseUrl?: string };

const ALIGNS: readonly FigureAlign[] = ["left", "right", "full"];

type Directive = { align: FigureAlign; caption: string; known: boolean };

function directiveOf(alt: string): Directive | null {
  const match = /^([A-Za-z]+)\|([\s\S]*)$/.exec(alt);
  if (!match) return null;
  const word = match[1].toLowerCase();
  const caption = match[2].trim();
  return (ALIGNS as readonly string[]).includes(word)
    ? { align: word as FigureAlign, caption, known: true }
    : { align: "full", caption, known: false };
}

/** Whether a path needs a base to resolve outside the page it was written for. */
function isRelativeAsset(url: string): boolean {
  return (
    !/^[a-z][a-z0-9+.-]*:/i.test(url) &&
    !url.startsWith("//") &&
    !url.startsWith("/") &&
    !url.startsWith("#")
  );
}

/** Hangs a document-relative path on an absolute origin, leaving absolute ones alone. */
export function resolveAsset(url: string, assetBaseUrl?: string): string {
  if (!assetBaseUrl || !isRelativeAsset(url)) return url;
  return `${assetBaseUrl.replace(/\/+$/, "")}/${url.replace(/^\.\//, "")}`;
}

export const remarkImageDirective: Plugin<[ImageDirectiveOptions?], Root> =
  (options = {}) =>
  (tree, file) => {
    const warnings = warningBag(file);
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined || node.children.length !== 1) return;
      const image = node.children[0];
      if (image.type !== "image") return;
      const directive = directiveOf(image.alt ?? "");
      if (!directive) return;
      const line = image.position?.start.line;
      if (!directive.known) {
        warnings.push({
          code: "unknown-image-align",
          message: `An image asked for alignment "${(image.alt ?? "").split("|")[0]}"; it is laid out full width instead.`,
          ...(line === undefined ? {} : { line }),
        });
      }
      if (isRelativeAsset(image.url) && !options.assetBaseUrl) {
        warnings.push({
          code: "relative-image",
          message: `The image at ${image.url} stays a relative path, which only resolves against the page it is served from.`,
          ...(line === undefined ? {} : { line }),
        });
      }
      const figure: Figure = {
        type: "figure",
        url: resolveAsset(image.url, options.assetBaseUrl),
        caption: directive.caption,
        align: directive.align,
        title: image.title ?? null,
        ...(image.position === undefined ? {} : { position: image.position }),
      };
      (parent as Parents).children.splice(index, 1, figure as never);
      return [SKIP, index + 1];
    });
  };
