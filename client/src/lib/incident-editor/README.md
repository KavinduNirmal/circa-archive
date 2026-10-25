# Incident draft model

## Responsibility and structure

- `model.ts` owns typed local incident drafts, form defaults, prose-only wikilink discovery, restricted-character imports, temporary numbering, image limits, and local validation.
- `storage.ts` owns one active draft in IndexedDB, including image blobs. One transaction stores the complete draft. Unknown or damaged payloads are rejected before editing can overwrite them.

## Boundaries and decisions

These modules contain no React, routing, translated copy, or server integration. Reference discovery ignores code, YAML, existing links, and image alt text. Entity destinations are supplied by the host; identifiers are never guessed into routes.

For this editor, the supplied entity and incident notes govern the form and registry behavior where older product context differs: characters require draft-specific imports, temporary entities use draft-scoped codes, and severity uses the current E–O/U scale. Permanent IDs, owner notifications, access enforcement, and atomic server submission remain backend responsibilities.

The incident body limit is checked against both 15,000 characters and 2,500 whitespace-separated words. Text is never truncated. Image limits are 10MiB each and 50MiB total; only PNG, JPEG, and WebP are accepted. Temporary counters survive removals to avoid recycling references within a draft.

## Usage and verification

The site host restores before mounting the controlled workspace. Drafts and blobs stay in the `circa-incident-drafts` database; font preferences use a separate localStorage key. This is browser-local storage, not a server backup.

From `client/`, run `bun run test -- tests/incident-editor-model.test.ts tests/incident-editor-storage.test.ts` and `bun run typecheck`.
