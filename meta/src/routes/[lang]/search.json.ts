import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { locales, t, type Locale } from "../../lib/site";
import { docTopic, docHref } from "../../lib/documents";
export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}
export const GET: APIRoute = async ({ params }) => {
  const locale = params.lang as Locale;
  const documents = (await getCollection("documents")).filter(
    (entry) => entry.data.locale === locale,
  );
  return new Response(
    JSON.stringify(
      documents.map((entry) => ({
        slug: entry.data.slug,
        title: t(locale, docTopic(entry.data.slug)!.navKey),
        text: entry.data.markdown,
        href: docHref(locale, entry.data.slug),
      })),
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
};
