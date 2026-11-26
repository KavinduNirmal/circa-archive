# Scripts

## Responsibility

Progressive enhancements for the project website. Every page remains readable and navigable without these scripts.

- `site.ts`: the mobile menu class, mutually exclusive dropdown panels, Escape handling, the documentation-only ⌘K shortcut, legacy fragment forwarding, and the top action.
- `document.ts`: documentation search loading/filtering, chapter disclosure state, and Markdown copy feedback.

## Boundaries

Search enhancement is scoped to `[data-docs]`; on every other page the ⌘K shortcut does nothing and no search field exists. No script may send content to a network service, persist choices beyond session storage for chapter groups, or replace native links and disclosures.

## Usage and verification

From `meta/`, run `bun run typecheck`, `bun run test`, and `bun run test:e2e`. See the [project guide](../../README.md).
