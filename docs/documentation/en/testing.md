# Testing

The suite holds the interface to what it claims: behaviour, catalogs, corpus parsing, and the two editions.

## Red, green, refactor

Write a failing behavioural test first, then the smallest implementation that passes, then refactor with the suite green. This is the repository's rule, not a preference; a test added after the fact tends to assert what the code does rather than what it should.

Prioritise authorization, lifecycle transitions, vote uniqueness, and visibility when those exist. Today, prioritise the renderer, the archive rules, and the catalog contract.

## Unit and interaction tests

Vitest runs in jsdom. Tests live in client/tests/ and are named for the surface or module they hold.

| File                        | Holds                                                                |
| --------------------------- | -------------------------------------------------------------------- |
| `markdown-pipeline.test.ts` | parse, redactions, figures, warnings, and the corpus contract.       |
| `archive-site.test.tsx`     | the reading edition, record pages, downloads, and the project pages. |
| `i18n-messages.test.ts`     | catalog key parity, placeholders, rich tags, and empty values.       |
| `desktop.test.tsx`          | the workstation shell, its windows, and their interactions.          |
| `window-manager.test.tsx`   | geometry, stacking, minimize, maximize, and drag state.              |

Components that read copy need the provider. Use renderWithIntl from tests/intl.tsx, which loads the real catalogs, so a test asserts the sentence a reader sees rather than a message key.

## The catalog contract

The catalog test compares the English and Korean catalogs key by key. It also checks placeholders, rich-text tags, empty values, balanced markup, and that a few prose strings are actually translated.

Add the English key first, then the Korean. A component that reads a missing key renders the key path, which is why this test is the one that catches a half-finished translation.

## Browser tests

Playwright runs against a real server on port 3001, configured in playwright.config.ts with Chromium. The suite covers responsive behaviour and language routing.

```sh
bunx playwright install chromium
bun run test:e2e
```

The config starts bun run dev unless a server is already running. In a sandbox, set PLAYWRIGHT_BROWSERS_PATH to a writable directory.

## What to cover first

There is no coverage threshold. A useful test names the failure it prevents. A test that renders a component and asserts it exists prevents a crash, not a regression; a test that asserts the wrong document is refused prevents a leak.

Known gaps are recorded in the per-surface READMEs. The archive's internal search still matches English class and status words, and the reader's relative timestamps remain English. Do not silently narrow a gap in a test.
