import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testIgnore: "auth.spec.ts",
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI exercises the production build; a fresh development server hydrates the
    // workstation too slowly for the boot handover window used by these specs.
    command: process.env.CI ? "bun run start -- --port 3001" : "bun run dev",
    url: "http://127.0.0.1:3001/en/desktop",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
