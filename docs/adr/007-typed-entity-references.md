# 007: Typed entity references and atomic draft submission

- **Status:** Proposed
- **Date:** 2026-10-21
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

The archive is gaining more than records. Organizations, characters, and recoveries are entities with their own registry pages, and authors need to link them from Markdown without pasting URLs or trusting free text. The draft model also lets an author invent a barebones organization, character, recovery, or evidence image while writing.

Two failure modes follow. A link can point at nothing, producing a broken filing. A failed submission can leave permanent organizations, characters, or orphaned images behind after the author abandons the draft. Neither is acceptable in a fiction whose premise is that the archive preserves what was actually filed.

Characters add a consent boundary. A character belongs to an author and has a usage policy. Importing a character is a request for one document, not a blanket licence, and a restricted character requires an explicit acknowledgement before submission.

## Decision

We resolve archive references at submission, inside one transaction, and we never promote a temporary entity unless the whole filing succeeds.

- Authors write typed `[[TYPE-NUMBER]]` links. Supported targets are Incidents (`INC`), Explorations (`EXP`), Evidence (`EVI`), Organizations (`ORG`), Characters (`CHR`), and Recoveries (`ITM`). Rumour links are not yet settled.
- The editor's **Entity Registry** mints `TEMP-[TYPE]-[NUMBER]` entities scoped to a draft id. Images added there are temporary evidence tied to that draft.
- Characters must be imported per draft. Importing a restricted character records an acknowledgement; the owner is notified asynchronously after a successful submission.
- Submission validates content, target visibility, and character permissions, then promotes temporary entities, rewrites temporary tokens to permanent codes, allocates display codes, computes the content hash, and writes revision 1. Any failure rolls back the entire operation.
- Discarding a draft discards its temporary entities, imports, and temporary images. References are navigation, not ownership or canon.

## Consequences

**Positive.** A filed record cannot cite a nonexistent or invisible entity, and an abandoned draft cannot litter the permanent registry. Character consent is recorded per document and is auditable.

**Negative.** Submission is slower and more complex than writing rows as the author types. The resolver must understand every entity type and every visibility rule, and its error messages must distinguish a reserved code from a hidden one without leaking the hidden entity. Reference resolution also becomes part of the read path, not only the write path.

**Follow-ups.** Define the rumour link token, the recovery reserved range, and the authority that decides sealed-access requests. Add integration tests for rollback, restricted-character acknowledgement, and hidden-target resolution before implementation. Revisit if the editor must support offline submission or if a third-party import needs to preserve character consent across drafts.

## Alternatives considered

- **Resolve links on the client and store rendered HTML.** It makes reading cheap but lets a stale or malicious client write broken references and loses the Markdown source of truth.
- **Create permanent entities while typing and clean up abandoned drafts later.** It avoids a large transaction but leaves orphaned entities and makes the registry unreliable.
- **Use plain URLs or slugs instead of typed codes.** It needs no resolver, but the codes are already the fiction's citation language and slugs would fork identity.

## References

- [ARCHITECTURE.md](../../ARCHITECTURE.md), sections 3.3, 3.4, 3.5.7, and 6.7–6.8.
- [Author guide](../AUTHOR_GUIDE.md), "Reference other filings with wikilinks" and "Characters and consent".
- [ADR 003](003-markdown-records-no-pdf.md): records remain Markdown rendered as paper.
- [ADR 004](004-fixture-backed-client.md): the client still runs on fixtures while domain contracts are designed.
