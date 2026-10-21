import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
export default defineConfig(
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
);
