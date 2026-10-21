import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
export async function getStaticPaths() {
  return (await getCollection("documents")).map((entry) => ({
    params: { lang: entry.data.locale, slug: entry.data.slug },
    props: { markdown: entry.data.markdown },
  }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
