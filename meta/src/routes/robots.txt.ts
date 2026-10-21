import { PROJECT_ORIGIN } from "../lib/site";
export const GET = () =>
  new Response(
    `User-agent: *\nAllow: /\nSitemap: ${PROJECT_ORIGIN}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
