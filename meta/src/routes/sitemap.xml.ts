import { DOC_TOPICS, docHref } from "../lib/documents";
import { locales, PROJECT_ORIGIN, projectHref } from "../lib/site";
export const GET = () => {
  const paths = locales.flatMap((locale) => [
    projectHref(locale),
    ...["about/project", "about/team", "about/terms", "sponsor"].map((path) =>
      projectHref(locale, path),
    ),
    ...DOC_TOPICS.map((topic) => docHref(locale, topic.slug)),
  ]);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${PROJECT_ORIGIN}${path}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
