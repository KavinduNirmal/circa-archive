# 008: V1 scope for the public archive

- **Status:** Accepted — implementation pending
- **Date:** 2026-10-26
- **Deciders:** Maintainers
- **Supersedes:** 004 for the public site only
- **Superseded by:** —

## Context

The archive has two audiences and one corpus: a server-rendered reading edition under `/{lang}/site` and a client-side workstation under `/{lang}/desktop`. The backend implements authentication, global search, destination reads, and sealed access requests; it does not yet implement filing, drafts, comments, assessments, playlists, entity authoring, revisions, or media. The client still reads illustrative fixtures for most archive surfaces and its editor keeps drafts in the browser.

The v1 definition needed to settle the content model before schema work could begin. It also had to retire a set of earlier ideas — branching, forks, adoption, stewardship, succession, foundational amendments, primary claims, and organisation governance — that appear across [AUTHOR_GUIDE.md](../AUTHOR_GUIDE.md), [ARCHITECTURE.md](../../ARCHITECTURE.md), and older lore notes. Those ideas are not part of v1; leaving them in the contracts would make the schema and the author-facing rules contradictory.

Fifteen questions (D1–D15) were answered by the maintainer on 2026-10-26. This ADR records the answers and the surrounding scope. It is a decision record, not an implementation report: the public site remains fixture-backed until the read-parity and writing milestones land.

## Decision

### Surface and lifecycle

| Area         | V1 decision                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface      | The public site only. Moderation UI and workstation parity are post-v1. Shared code lives in shared modules.                                                                 |
| Filing types | Incidents, explorations, evidence, and rumours can be created, published, read, and edited.                                                                                  |
| Branching    | No branches, forks, continuations, adoption, stewardship, succession, or foundational amendments. A record's parent is the incident it is **filed against** (`incident_id`). |
| Playlists    | Incident-scoped, author-owned, public, full CRUD. "Personal canon" is a playlist, not an adopted continuity.                                                                 |
| Comments     | A separate entity, not a record type, on record and incident pages. Guests read; signed-in users write.                                                                      |
| Assessments  | `Corroborate` / `Contest` on filings only, one per account, removable. Counts are visible; the default list order is chronological.                                          |
| Drafts       | Server-persisted. Multiple drafts, autosave, resume on any device, publish from the draft. Browser storage is only an offline cache.                                         |
| Lifecycle    | Create, read, and edit one's own filing with revision history. Deletion and withdrawal are not v1.                                                                           |
| Data         | The API is the only runtime source for `/site`. Fixtures remain test and reference data; the launch seed is hand-authored.                                                   |
| Auth         | Guests read; signed-in users write.                                                                                                                                          |

### The fifteen decisions

| ID  | Decision                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Comments are their own entity in the database, not a record type, and never appear in search results.                                                                                      |
| D2  | The `Disputed` advisory is a text notice only. Assessment counts are shown in front of the filing (as on Reddit) so readers judge for themselves.                                          |
| D3  | No self-assessment: an author cannot Corroborate or Contest their own filing, and their assessment is excluded from counts.                                                                |
| D4  | Playlists are public only in v1. Private and unlisted playlists are post-v1.                                                                                                               |
| D5  | Reserved code ranges return `200` with `Missing Record`. `404` is reserved for identifiers that exist but are not held.                                                                    |
| D6  | The launch seed is three organisations, three incidents, and three recoveries. No exploration records are seeded.                                                                          |
| D7  | Entity editing is author-only in v1. Appointed moderators and other editors are post-v1.                                                                                                   |
| D8  | Character-owner notification is deferred. The guide must not promise it in v1.                                                                                                             |
| D9  | Character policies are `Open` and `Restricted`. Referencing is allowed under either policy; the policy changes what content a record may establish, not whether it may cite the character. |
| D10 | Media storage is S3-compatible in production; a local adapter may serve development.                                                                                                       |
| D11 | `/ko` preselects Korean for search, with the language selector still visible.                                                                                                              |
| D12 | `sealed` is cosmetic: a reader dismisses an overlay with a button. `restricted` is a platform denial that returns `401` with the clearance notice.                                         |
| D13 | `follows_record_id` is retired. Leave the column unused and drop it in a later migration.                                                                                                  |
| D14 | Assessments apply to records (explorations, evidence, rumours) only. Incidents are not assessed in v1.                                                                                     |
| D15 | Incident pages carry comments. Comments target either an incident or a record through a polymorphic target.                                                                                |

### Comments

Comments are a discussion entity with their own table and API. They are not filings, do not consume an archive code, do not appear in search, and do not affect canon. A comment has one target — an `INC` incident or an `EXP`/`EVI`/`RUM` record — and either no parent (a root) or a root parent (one reply level). Replies cannot be replied to.

- Guests may read threads. Signed-in users may write; the author identity comes from the session, never from a free-text field.
- A comment can be edited or deleted by its author. A deleted root hides or tombstones its replies consistently.
- Counts appear on the record and in lists; comment bodies are not indexed by search.
- Comments never vote, never carry warnings, and never change lifecycle.

### Assessments

`Corroborate` and `Contest` are reader assessments of a filing, not truth claims and not ratings of the incident. One assessment per account per filing; it can be removed at any time. The author's own assessment is rejected and excluded from aggregate counts. Counts are readable on the record page, the filings list, and search results.

The `Disputed` advisory is computed from the counts (at least ten assessments and at least 70% contest) and rendered as a text notice above the body. It does not create a stored status, does not change default ordering, and does not add a `contested` value to the search status facet. A reader may explicitly choose a `top` sort; chronological remains the default. Incidents are not assessed in v1.

### Playlists

A playlist is an author's curated reading order for one incident. It is public, incident-scoped, and owned by its author. V1 supports create, rename, describe, add, remove, reorder, and delete; the incident author's playlist is pinned first; a record shows the playlists it appears in. Playlists do not establish canon, adoption, evidence, or visibility. Private and unlisted visibility are post-v1.

### Access policy

- `public` renders normally.
- `sealed` withholds the body behind a cosmetic overlay that a button removes. There is no approval queue or request record in v1.
- `restricted` returns `401` with a diegetic clearance notice. Classification (`LEVEL 3`–`LEVEL 6`) stays cosmetic and grants nothing.
- Content warnings keep their four states: tier, tags, `None`, and `No Warnings Apply`; `Warnings Not Provided` remains distinct from `None`.

### Characters, organisations, and recoveries

Organisations, characters, and recoveries are created and edited by their author; no moderator or second-editor role exists in v1. Directories exist for all three, and every dossier has a canonical URL.

Characters use two policies, `Open` and `Restricted`. A reference is permitted under both; the policy governs what the citing record may assert about established characterisation, history, relationships, and agency. Importing is scoped to one draft and is not a blanket licence. Owner notification on import is deferred. Recognition voting, organisation governance, character auto-generation, and recovery galleries are post-v1.

### Data, search, and media

- The runtime site reads the API for every route. Fixtures may remain in tests and reference data, never as a silent fallback.
- The launch seed is three organisations, three incidents, and three recoveries, with no seeded explorations. Seeding must be idempotent and documented.
- `/ko` preselects Korean in the search language field; the reader can still change it.
- Comments are not search-indexed.
- Media is S3-compatible in production with a local development adapter. Uploads are draft-scoped until publish, and a published filing references stable assets.
- `follows_record_id` is unused and out of the API. It is dropped in a later migration.

## Consequences

**Positive.** The schema has one parent relation, one comment entity, one assessment model, and one playlist model. The author guide stops promising adoption, branching, steward roles, and owner notifications that the product will not build. Search no longer needs a vote-derived status, which keeps counts and canonical states separate. Sealed records lose an approval workflow that had no decider while restricted records keep a real platform boundary.

**Negative.** Removing adoption and branching discards a large body of lore and authoring expectations; the guide must explain the replacement (filed-against incidents, playlists) clearly. Public-only playlists and no self-assessment are visible product constraints. Sealed records become a presentation trick rather than a security boundary, so a sealed body must not contain content that cannot be shown. Author-only entity editing means a departed author's entity cannot be corrected in v1.

**Follow-ups.** Implement the schema foundation and migration runner ([ADR 009](009-versioned-archive-schema-migrations.md)). Build comment, assessment, playlist, draft, revision, and media endpoints under the write policy. Remove the fixture branch from `/site` and commit the redesign. Update `AUTHOR_GUIDE.md`, `ARCHITECTURE.md`, the route map, the project context, and the READMEs. Add tests for self-assessment rejection, comment threading and ownership, playlist ordering and pinning, reserved-code `200`, and sealed-overlay versus restricted-`401` reads.

## Alternatives considered

- **Keep comments as a record type (the ADR 006 framing).** Rejected: a comment has no code, no lifecycle, no warnings, no assessments, and must not appear in search. Modelling it as a filing would force those fields to be optional and would pollute every record query.
- **Keep the sealed access-request workflow and add an author-side approval surface.** Rejected for v1: the moderation console is out of scope, and a request queue with no decider is worse than a cosmetic overlay. It can return with moderation.
- **Keep vote-derived `Contested` as a status and search facet.** Rejected: the maintainer asked for counts in front of the record and a text notice only. A stored status gives a small number of votes ordering power that the v1 model does not want.
- **Keep playlists private/unlisted in v1.** Rejected: every read, endpoint, and test would need visibility rules; public-only is the smaller correct surface.
- **Allow self-assessment.** Rejected: it makes counts trivially gameable and conflicts with the assessment's purpose.
- **Keep adoption and branching as lore-only while omitting the UI.** Rejected: the author guide would keep promising a workflow the product cannot perform. The lore can keep its own language; the platform contract does not.
- **Import the fixture corpus at launch.** Rejected: the fixtures carry retired taxonomy and the launch needs a small, authored, lore-accurate seed.

## References

- [AUTHOR_GUIDE.md](../AUTHOR_GUIDE.md) — author-facing rules rewritten for this scope.
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — v1 schema and API contracts.
- [docs/documentation/en/routes.md](../documentation/en/routes.md) — the public route map.
- [ADR 004](004-fixture-backed-client.md) — fixtures, superseded for the public site.
- [ADR 006](006-session-tokens-in-http-only-cookies.md) — sessions; its "comment is a record" context is superseded here.
- [ADR 009](009-versioned-archive-schema-migrations.md) — the migration strategy that applies this model.
