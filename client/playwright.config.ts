import { defineConfig, devices } from "@playwright/test";
const port = process.env.CIRCA_E2E_PORT ?? "3001";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["auth.spec.ts", "search-api.spec.ts"],
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI exercises the production build; a fresh development server hydrates the
    // workstation too slowly for the boot handover window used by these specs.
    command: process.env.CI
      ? `bun run start -- --port ${port}`
      : `bun run dev --port ${port}`,
    url: `http://localhost:${port}/en/desktop`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
