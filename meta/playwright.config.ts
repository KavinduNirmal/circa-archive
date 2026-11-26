import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "4321";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `bunx astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `${baseURL}/en/`,
    reuseExistingServer:
      process.env.PLAYWRIGHT_REUSE !== "0" && !process.env.CI,
    timeout: 30000,
  },
});
