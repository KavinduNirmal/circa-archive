import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { DOC_GROUPS, DOC_TOPICS } from "./registry";
import { locales, projectHref, sourceUrl, type Locale } from "./site";
export { DOC_GROUPS, DOC_TOPICS };
export type DocTopic = (typeof DOC_TOPICS)[number];
export const repositoryRoot = resolve(process.cwd(), "..");
export const PUBLIC_ASSETS: Record<string, string> = {
  "docs/lore/Pasted image 20261018211443.png": "lore-anatomy.png",
};
export const docTopic = (slug: string) =>
  DOC_TOPICS.find((topic) => topic.slug === slug);
export const docHref = (locale: Locale, slug: string) =>
  projectHref(
    locale,
    slug === "overview" ? "documentation" : `documentation/${slug}`,
  );
export function sourcePath(slug: string, locale: Locale): string {
  const topic = docTopic(slug);
  if (!topic) throw new Error("Unknown public document");
  return "sourceFile" in topic
    ? topic.sourceFile
    : `docs/documentation/${locale}/${topic.slug}.md`;
}

/** Resolve only public registered documents/assets locally; never publish arbitrary repository paths. */
export function resolveDocLink(
  href: string,
  path: string,
  locale: Locale,
  image = false,
): string | null {
  if (!href || href.startsWith("#")) return href;
  if (/^(?:https?:|mailto:)/i.test(href)) return href;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;
  if (href.startsWith("/")) {
    const match = href.match(/^\/(en|ko)\/meta(?:\/(.*))?$/);
    if (match) return projectHref(match[1] as Locale, match[2] ?? "");
    return href;
  }
  let url: URL;
  let target: string;
  try {
    url = new URL(href, `https://repository.local/${path}`);
    target = decodeURIComponent(url.pathname.slice(1));
  } catch {
    return null;
  }
  if (
    target
      .split("/")
      .some((part) => part === "private" || part.startsWith(".")) ||
    target.startsWith("meta/")
  )
    return null;
  if (image)
    return PUBLIC_ASSETS[target]
      ? `/assets/${PUBLIC_ASSETS[target]}`
      : sourceUrl(target) + url.search + url.hash;
  const topic = DOC_TOPICS.find((candidate) =>
    locales.some((lang) => sourcePath(candidate.slug, lang) === target),
  );
  return (
    (topic ? docHref(locale, topic.slug) : sourceUrl(target)) +
    url.search +
    url.hash
  );
}

export type PublicDocument = {
  id: string;
  slug: string;
  locale: Locale;
  contentLocale: Locale;
  sourcePath: string;
  markdown: string;
  updatedAt: string | null;
};
export async function loadPublicDocuments(): Promise<PublicDocument[]> {
  const dates = new Map<string, string | null>();
  return Promise.all(
    locales.flatMap((locale) =>
      DOC_TOPICS.map(async (topic) => {
        const path = sourcePath(topic.slug, locale);
        const markdown = await readFile(resolve(repositoryRoot, path), "utf8");
        if (!dates.has(path)) {
          try {
            const date = execFileSync(
              "git",
              ["log", "-1", "--format=%cI", "--", path],
              {
                cwd: repositoryRoot,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
              },
            ).trim();
            dates.set(
              path,
              date && Number.isFinite(Date.parse(date)) ? date : null,
            );
          } catch {
            dates.set(path, null);
          }
        }
        return {
          id: `${locale}/${topic.slug}`,
          slug: topic.slug,
          locale,
          contentLocale: "sourceFile" in topic ? "en" : locale,
          sourcePath: path,
          markdown,
          updatedAt: dates.get(path) ?? null,
        };
      }),
    ),
  );
}
