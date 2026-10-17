import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
    /**
     * next-intl's runtime imports `next-intl/config` and expects the project's
     * request configuration to be found there; `src/i18n/request.ts` is that file.
     *
     * next-intl ships a Next plugin that installs this alias, and the alias is set
     * here instead. The reason is narrow but real: Next compiles this config to
     * CommonJS, and the plugin's CommonJS build requires `@swc/core` at module
     * scope for its message-extraction feature, which this project does not use.
     * Loading it would put a native binary on the config-loading path for nothing.
     * The plugin's only other effect, for a project with no `basePath` or
     * `trailingSlash`, is this one alias — so if next-intl ever needs more from it,
     * this is the line to replace with `createNextIntlPlugin()`.
     */
    resolveAlias: { "next-intl/config": "./src/i18n/request.ts" },
  },
};

export default nextConfig;
