import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
export default defineConfig({
  site:
    process.env.PROJECT_SITE_ORIGIN ??
    env.PROJECT_SITE_ORIGIN ??
    "http://localhost:4321",
  output: "static",
  trailingSlash: "always",
  i18n: {
    locales: ["en", "ko"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    react(),
    {
      name: "circa-explicit-routes",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => {
          const routes = [
            ["/", "index.astro"],
            ["/404", "404.astro"],
            ["/robots.txt", "robots.txt.ts"],
            ["/sitemap.xml", "sitemap.xml.ts"],
            ["/[lang]/", "[lang]/index.astro"],
            ["/[lang]/sponsor/", "[lang]/sponsor.astro"],
            ["/[lang]/documentation/", "[lang]/documentation/index.astro"],
            [
              "/[lang]/documentation/[slug]/",
              "[lang]/documentation/[slug].astro",
            ],
            ["/[lang]/source/[slug].md", "[lang]/source/[slug].md.ts"],
            ["/[lang]/search.json", "[lang]/search.json.ts"],
            ["/assets/[asset].png", "assets/[asset].ts"],
            ...["project", "team", "terms"].map((page) => [
              `/[lang]/about/${page}/`,
              `[lang]/about/${page}.astro`,
            ]),
          ];
          // Folder READMEs are mandatory in this repository and must never become pages.
          for (const [pattern, file] of routes)
            injectRoute({
              pattern,
              entrypoint: `./src/routes/${file}`,
              prerender: true,
            });
        },
      },
    },
  ],
  vite: { server: { fs: { allow: [".."] } } },
});
