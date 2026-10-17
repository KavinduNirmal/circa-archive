import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      /**
       * `next-intl`'s ESM build imports the extensionless `next/server`, which
       * Node resolution rejects because Next only declares `next/server.js`.
       * The app is bundled by Turbopack, which resolves it, so the mismatch is
       * only visible to the test runner.
       */
      "next/server": "next/server.js",
      /**
       * The Next plugin aliases `next-intl/config` to the request configuration
       * so server helpers can find a project's messages. Nothing performs that
       * aliasing under the test runner, so it is declared here too; without it
       * any import of `next-intl/server` fails to resolve.
       */
      "next-intl/config": fileURLToPath(new URL("./src/i18n/request.ts", import.meta.url)),
      /**
       * `next-intl/server` ships a client-condition build whose every export
       * throws, and a `react-server` build that is the real implementation. Next
       * picks the latter for Server Components; the test runner has no such
       * condition, so it is selected here by path. Without this, importing a
       * page's `generateMetadata` fails with "not supported in Client Components".
       */
      "next-intl/server": fileURLToPath(
        new URL("./node_modules/next-intl/dist/esm/development/server.react-server.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    /**
     * `next-intl` is inlined rather than handed to Node, because its ESM build
     * imports the extensionless `next/server` that only a bundler resolves. In
     * the app Turbopack does that; here the alias above needs the module to pass
     * through Vite's resolver at all.
     */
    server: { deps: { inline: ["next-intl"] } },
  },
});
