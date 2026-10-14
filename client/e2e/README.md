# Scaffold browser smoke test

## Responsibility and structure

`scaffold.spec.ts` verifies the home route responds successfully, metadata is set, and the blank page uses CIRCA's background. It does not exercise application UI because none exists.

## Usage and boundaries

From `client/`, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. Playwright starts the development server when needed. Use unit tests for utility behavior; add interaction tests only when application screens are implemented. Generated traces and reports are ignored.
