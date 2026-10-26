import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "search-api.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: { baseURL: "http://127.0.0.1:3102", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "dotnet run --project ../backend/tests/Circa.BrowserTestHost",
      url: "http://localhost:5041/api/v1/archive/INC-880001",
      env: {
        CIRCA_SEARCH_E2E: "1",
        DOTNET_PROCESSOR_COUNT: "2",
        DOTNET_CLI_USE_MSBUILD_SERVER: "0",
        MSBUILDDISABLENODEREUSE: "1",
      },
      timeout: 120000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 10000 },
    },
    {
      command: "bunx next dev --hostname 127.0.0.1 --port 3102",
      env: {
        API_ORIGIN: "http://localhost:5041",
        SEARCH_SOURCE: "api",
        CIRCA_SEARCH_E2E: "1",
        CIRCA_LOW_RESOURCE: "1",
        RAYON_NUM_THREADS: "1",
      },
      url: "http://127.0.0.1:3102/en/site/records",
      timeout: 120000,
    },
  ],
});
