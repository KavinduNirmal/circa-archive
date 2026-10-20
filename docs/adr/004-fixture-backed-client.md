# 004: The client runs on local fixtures until the backend exists

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Implementation update — 2026-10-20

The fixture decision still applies to archive records and workstation content. Account registration, sign-in, and personal access now use the .NET authentication service; the client is no longer entirely fixture-backed. See the [client authentication guide](../../client/src/lib/auth/README.md).

The context and decision below are retained as the historical record.

## Context

The backend does not exist yet ([ADR 005](005-modular-monolith-backend.md)), but the public archive, the workstation, the record reader, the record editor, the mail client, and the file browser all need believable content to be designed, built, tested, and demonstrated. Waiting for the API would have blocked the entire product surface.

One document is special: `client/public/Ghost_story.md` is the published record corpus and the file an author edits. A browser bundle cannot read a file at runtime, so the reader needs the same bytes in the bundle.

## Decision

Until the backend ships, every surface reads from its own local fixture module, and the published corpus is the single editable source.

- Fixtures live beside the surface that reads them — archive indices, mail correspondence, file trees — as typed TypeScript modules, not as a shared mock database.
- `client/public/Ghost_story.md` is the file to edit. `client/src/components/reader/ghost-story.ts` is generated from it by `client/scripts/sync-corpus.ts`; the generated file is never hand-edited.
- Tests hold the generated bundle and the published file byte-identical, so the copy cannot drift.
- Fixture modules are replacement points, not a contract. When the backend lands, a surface switches from its fixture module to an API call; it does not migrate the fixture shape.

## Consequences

**Positive.** The entire UI can be built and reviewed before the backend exists. Tests and browser tests run without a database or network. The corpus has one editable source with a mechanical, verified copy.

**Negative.** Fixtures can become an accidental specification: a shape that exists only because it was convenient in TypeScript may not survive contact with the API. The client bundle carries content that will later be fetched. Two copies of the corpus exist in the repository by design, which is a standing invitation to edit the wrong one — the test is the guard.

**Follow-ups.** This ADR is superseded when the archive and workstation read from the backend. The replacement should state which surfaces move first and what happens to the fixture modules. The corpus may remain the published file even then; only its delivery changes.

## Alternatives considered

- **Build the backend first.** Rejected: it would have serialized product design behind infrastructure, and the client was the cheaper place to discover what the data model needs to be.
- **Run a mock HTTP server.** Rejected: a second process to start, a second schema to maintain, and tests that depend on a port. Typed modules give the same isolation with no runtime.
- **Load records as static JSON.** Rejected: JSON cannot carry the record's Markdown and metadata as naturally as the typed modules, and the reader needs Markdown, not a serialized tree.

## References

- [`client/README.md`](../../client/README.md) — "Backend integration remains unimplemented, so every screen reads from its own index rather than a service."
- [`client/scripts/sync-corpus.ts`](../../client/scripts/sync-corpus.ts) — the only writer of the bundled corpus.
- [`client/tests/ghost-story-sync.test.ts`](../../client/tests/ghost-story-sync.test.ts) and [`client/tests/record-sources.test.ts`](../../client/tests/record-sources.test.ts) — the drift guards.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — the planned backend that replaces this arrangement.
