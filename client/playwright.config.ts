import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Readiness is probed at the concrete prerendered route, not at the bare path the proxy redirects.
  webServer: { command: "bun run dev", url: "http://127.0.0.1:3001/en/desktop", reuseExistingServer: !process.env.CI, timeout: 120000 },
});
