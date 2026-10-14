# CIRCA Archive — Project Context Document

**Working title:** CIRCA Archive (or similar)
**Status:** Concept / Pre-production
**Last updated:** 2026-03-11
**Purpose:** A comprehensive record of every design decision, mechanic, and open question agreed upon during the initial design conversations. This document is the source of truth for the project's direction. It supersedes prior conversations where conflicts exist.

---

## 1. Core Concept

A collaborative storytelling platform where users write, explore, and expand ghost stories within a shared fictional universe. Inspired structurally by the "Exploration Records" model in *Got Dropped into a Ghost Story*, but set in an original universe.

**The fantasy:** A diegetic desktop interface (CIRCA/OS) that users navigate like a real file system. Icons are navigation. Folders contain stories. Records open as paper-like PDFs (rendered from Markdown, not actual PDFs). An email client provides discovery and system communication. The user is, in-world, a CIRCA analyst exploring anomalous incidents — though the meta-layer suggests they may be something else entirely.

**The meta-layer:** CIRCA is an ancient ghost story that has forgotten it's a ghost story. It survives by being told. Every record written by a real user feeds it. In-world, users think they're reviewing cold cases. In reality (fictionally), their writing manifests horrors into the story's world. The platform creator is the only one who sees the whole loop.

---

## 2. Lore Foundation

### 2.1 CIRCA

- **Full name:** Commission for Incident Review and Corrective Action
- **Nature:** Not a government agency. A **continuity** — a bureaucratic entity that predates modern governments and attaches itself to whatever power structure exists in a given era. In 100 BC it might have been a temple archive; under Rome, an augur's ledger; under Han China, a censorate.
- **Original name:** Dead/unknown. The current name is a translation.
- **Function:** Reviews incidents that shouldn't have happened and files records about them. It does not "correct" reality. It files paperwork on it.
- **Core principle:** **CIRCA does not decide truth. It decides what's on file.** The archive has no opinion.
- **Meta-truth:** CIRCA is a ghost story that survives by being told. It doesn't know this. It thinks it's a bureaucracy.

### 2.2 The Ghost Story Engine

- Incidents are ghost stories. They spread like memes.
- When enough users explore an incident, it becomes "real" (in-world).
- The archive is a lure. Every follow-up record is a new telling.
- The ghost story uses those tellings to project horrors into the story's world.
- It does this for one reason: a story that isn't told dies.

### 2.3 Organizational Languages

Like GDGSW, different organizations use different classification languages for the same phenomenon:

- **Daydream Inc. (GDGSW reference):** Code style `Qterw-{grade}-{number}`. Calls ghost stories "Darkness."
- **Supernatural Disaster Management Bureau (GDGSW reference):** Code style `1793P-SYA.2001.파31`. Calls them "Disasters."
- **Implication for CIRCA Archive:** Each org has its own vocabulary, its own designation conventions, its own institutional personality. The same incident appears under multiple org lenses with different names.

---

## 3. Organizations

### 3.1 Fundamental Rules

- **Orgs are NOT users.** No login, no account, no inbox, no messaging, no notifications.
- **Orgs are entities.** They exist as records and files, not as agents.
- **No Handlers.** No user is authoritative over an org. No gatekeeping.
- **Orgs are mythic, not authorial.** They exist as aggregates of what's been written about them, not as coherent institutions.
- **Three seeded orgs** will be created by the platform creator at launch (CIRCA + two rivals). Everything else is user-generated.

### 3.2 Org Lifecycle

```
Tag → Eligible → Promoted (ORG-A-XXXX)
                → Rejected (CIRCA-R-XXXX) → Appeal → Reinstated or Erased
```

| State | Has code? | In directory? | Can be adopted into? | Notes |
|---|---|---|---|---|
| **Tag** | No | No | No | Free to create. Anyone can tag records with it. |
| **Eligible** | No | No | No | Crossed threshold for review. |
| **Promoted** | Yes (`ORG-X-XXXX`) | Yes | Yes | Recognized. Holds continuities. |
| **Rejected** | Becomes `CIRCA-R-XXXX` | No | No | Erased. Records remain as rumors. |
| **Reinstated** | Returns to promoted status | Yes | Yes | After successful Reclassification Petition. |

### 3.3 Org Code Structure

- **Format:** `ORG-{Letter}-{Number}` e.g. `ORG-A-081323`
- **Letter = carnage rating of founding incident:**
  - `U` — Unrated / Unknown
  - `S` — Singularity / Extinction-level
  - `A` — Mass casualty (100+)
  - `B` — Multiple (10–99)
  - `C` — Few (1–9)
  - `D` — No casualties
- **Letter is fixed at promotion.** It is the origin story, not a live status. Later incidents get their own codes; they don't rewrite history.
- **Two codes per org:**
  - **CIRCA code** — immutable, universal, generated at creation (`CIRCA-ID-XXXX` → `ORG-A-XXXX`)
  - **Org code** — assigned on promotion, stable thereafter

### 3.4 Creating a New Organization

**Method:** Users submit an **organization identification**, framed in-world as CIRCA becoming aware of a new org.

**Submission format:**
1. **Brief** — what the org is, what it calls the paranormal, how it classifies incidents. Its language.
2. **Voice** — one short sample record in the org's voice. The audition.
3. **Seed** — a one-paragraph pitch for the first incident that puts them on CIRCA's radar.

**Voting:** Community votes on the submission. Votes are **advisory signals**, not binding decisions.

**Thresholds:**
- **Interest threshold** (e.g. 20 upvotes, 60% positive) — submission becomes eligible for review.
- **Coherence threshold** — a moderator confirms the Brief is consistent, the Voice is distinct, and the Seed doesn't contradict established canon.

**Outcomes:**
- Pass both → `ORG-A-XXXX` (adopted)
- Pass interest, fail coherence → `ORG-P-XXXX` (provisional — exists but can't adopt)
- Fail interest → `CIRCA-R-XXXX` (erased)

### 3.5 Rejection and Appeals

- **Rejected orgs are not deleted.** They become `CIRCA-R-XXXX` and are marked **erased** in-world. CIRCA's records say they never existed. The archive keeps them.
- **Erased orgs are browsable.** The `CIRCA-R` folder is a graveyard of orgs that tried to exist.
- **Rumors persist.** Records written while the org was erased are flagged `written_while_erased`. They stay linked.
- **Reinstatement is possible.** Via **Reclassification Petition** (see §3.6).

### 3.6 Reclassification Petition (Appeal)

- **One appeal per rejection.** If the appeal fails, the org is locked for 30 days before another version can be submitted.
- **The appeal must include a diff** — what changed from v1 to v2. Not a fresh pitch. A delta.
- **Voters see v1 alongside v2**, with changes highlighted. They judge the edit, not the whole thing.
- **Empty diff → auto-rejected.** This does the anti-spam work.
- **Versioning:** Appeals create a new **version** of the same org, not a new org. Same `id`, new `version` row.

### 3.7 Near-Identical Detection

When a user submits a new org, the system runs a **fuzzy match** against existing orgs. It does **not** block. It offers three buttons:

- **Same org** — merge submission into existing org's dossier as a proposed edit.
- **Variant** — create a new org linked to parent as `ORG-A-081323-V1`. A faction, chapter, or successor.
- **New** — proceed. Similarity flag logged for reviewers but does not block.

The algorithm is a **suggestion engine**, not a gate. Names like `Hollow Choir` vs `The Choir` require human judgment.

### 3.8 Recognition

- Only **promoted orgs** and **CIRCA** can recognize other orgs.
- Recognition happens via a **recognition record** — a memo, field report, or intercepted transmission that names the new org.
- **Bilateral:** the recognizing org's author must approve, and the recognized org's creator must approve the terms.
- This is how canon spreads organically once the platform has a few recognized orgs.

### 3.9 Organizations as Independent Entities

- **Incidents do not belong to orgs.** Incidents are independent (`INC-XXXXX`).
- Orgs file **reports about** incidents. They own their interpretation, not the ghost.
- Multiple orgs can file reports on the same incident, each with its own designation and lens.
- A new org can file a report on a 2,000-year-old incident. The past is open.

### 3.10 Flair vs Record Tags

**Flair:**
- Purely cosmetic. Like wearing a band shirt.
- Switchable at any time.
- Does not affect records.
- Does not appear on the byline of records.

**Record Tags:**
- Chosen at filing time, per record.
- Durable — part of the file.
- Determines which org's lens the record uses.

**Byline:**
- Always just the username of the author.

**Optional field on records:** `relationship: self | about`
- `self` — the author claims the org's perspective.
- `about` — the author is writing *about* the org from outside.

---

## 4. Incidents

### 4.1 Core Rules

- Incidents are the ghost stories. They are independent of orgs.
- Each incident has an immutable CIRCA code: `INC-XXXXX`.
- The first author to file an incident is its **Originator**.
- The Originator gets permanent credit, first-lens privilege (their record pinned at top), and a 30-day window to name the primary claim holder.

### 4.2 Primary Claim

- **Singular.** One incident, one primary claim.
- **First-to-file default.** If the author never names a primary, the first org to file a discovery record gets primary claim.
- **Author override window.** 30 days after publishing, the author can name any org as primary.
- **Ceded, not taken.** Primary claim can only change if the current holder cedes it, dissolves, or is erased. No org can seize it.
- **Contested state is valid.** If two orgs file within 72 hours and neither has primary claim, the incident enters `CONTESTED`. This can persist indefinitely.

**Primary claim gets:**
- Their designation appears first in the incident's alias list.
- Their report is pinned as the "master file" on the incident page.
- They curate the incident's canonical brief — not the reports, just the brief.

**Primary claim does not get:**
- The right to block other orgs from filing.
- The right to delete other orgs' records.
- The right to declare another org's report apocryphal.

### 4.3 The Incident Page

The incident page is the hub. It shows:

- **Pinned:** the Originator's original incident record
- **Master File:** the primary claim holder's report (or two, if contested)
- **Filed Records:** all exploration records, grouped by org lens
- **Rumors:** records tagged as rumor
- **Erased-Period Rumors:** records written while an involved org was `CIRCA-R`
- **Recognition Lineage:** which orgs have filed on this incident
- **Contested Banner:** if applicable, showing the competing claims

The page does not declare truth. It declares what's on file.

---

## 5. Records

### 5.1 Record Types

Three first-class types, kept small:

1. **INCIDENT** — the original ghost story. Bystander POV (preferred but not mandatory). No rules. Pure experience. Only the Originator can file this, and only once per incident.
2. **DISCOVERY** — the first org contact. How they found it. Establishes primary claim by default.
3. **EXPLORATION** — everything after. Containment attempts, follow-ups, rule-establishment, cross-references, forks.

Plus:

- **RUMOR** — propaganda, misinformation, unverified claims. Attach to orgs or incidents.

Subtypes like `CONTAINMENT`, `INTERVIEW`, `AUTOPSY`, `MEMO` are **tags**, not first-class types.

### 5.2 Rules for Record Types

- **Discovery is not a prerequisite.** Any org can file any type at any time.
- **INCIDENT records are not locked to bystander POV.** The constraint is temporal (written before any org established rules), not narrative.
- **The rules of a ghost story emerge from follow-ups.** The original incident has no rules. Exploration records establish them.

### 5.3 Rules Establishment

- Each org establishes its own rules for an incident via its exploration records.
- The incident page aggregates rules:
  - **Consensus rules** — appear across multiple orgs. Displayed prominently.
  - **Idiosyncratic rules** — unique to one org. Displayed under that org's lens.
  - **Contested rules** — contradictory. Displayed side by side, unresolved.
- No central authority. No rule canon. Just observed convergence and disagreement.

### 5.4 Forking

- Records can be forked. Each fork gets its own canon ID and inherits the original's lineage.
- Fork trees are visible in the UI.
- Forking is the pressure valve for contradictions. Contradictions don't get resolved — they get forked.

### 5.5 Comments vs Records

- **Comments:** public discussion. Anyone can comment. Flair is cosmetic. Doesn't affect canon.
- **Records:** authored artifacts. Filed under org codes. Affects canon.
- **Keep separate.** Comments are the reading room; records are the library.

---

## 6. Canon

### 6.1 No Authoritative Canon

There is no single canon. The word "canon" is retired. Replaced with:

- **Recognized** — CIRCA has a file on this org.
- **Adopted** — a record has been accepted into an org's continuity.
- **Continuity** — a branch of an org's story. Multiple coexist.
- **Filed** — in the archive, visible.

### 6.2 Orgs Are Mythic

- Orgs have no coherent voice. No authoritative figure.
- Voice emerges from aggregate writing. The most prolific writers shape it most.
- Contradictions within an org's page are normal. The page is a nexus, not a statement.

### 6.3 Continuities

- An org can hold multiple continuities simultaneously: `ORG-A-081323/C1`, `ORG-A-081323/C2`.
- Readers subscribe to a continuity, not an org.
- A fork creates a new continuity.

### 6.4 Erased Orgs

- Erased orgs (`CIRCA-R`) cannot adopt, recognize, or hold continuities.
- Their records remain visible and referenceable.
- Other orgs can adopt an erased org's rumors into their own continuities ("we know about them, they're real").
- This is intentionally allowed. Creativity comes from rebellion of truth.

---

## 7. Moderation

### 7.1 The Meta / In-World Split

**Meta violations — reported, reviewed, tombstoned:**
- Harassment of real users (doxxing, threats, targeted abuse)
- Spam, SEO garbage, bot content
- Plagiarism of another user's record
- Illegal content (CSAM, credible threats of violence)
- Hate speech targeting real-world groups
- Attempts to game the rating system (vote brigading, alt accounts)

**In-world content — never deleted, filed:**
- Propaganda against a fictional org
- Contradictory lore
- Low-effort or badly written records
- Character assassination of fictional characters
- Edgy, offensive, or uncomfortable fiction within the fiction
- Rumors, lies, misinformation about fictional things

**The test:** Does it harm a real person, or a fictional one? Harm to a real person = meta. Harm to a fictional entity = filed.

### 7.2 The Grey Zone

Case: a "rumor" that thinly veils an attack on a real user. Resolution:

- **Consent test.** If a user reports a record as being about them, and a moderator confirms the connection is plausible, the record is tombstoned.
- **Narrow window:** the user must be *identifiable* from the content. If the connection requires context only they know, it's fiction.

### 7.3 Tombstoning

- **Tombstoned records are removed from discoverability.**
- **Only the author can view them**, via their dashboard.
- **The author is notified** with the specific rule violated and the triggering report (anonymized).
- **No appeals process.** The author cannot contest.
- **Content hashing on submit** prevents reposting.
- **Strike count on the author's dashboard.** 3 in 30 days → temporary posting restriction. 5 in 90 → manual review.
- **Public moderation record.** Individual records stay private, but a public log of moderation decisions (category counts, no specifics) is maintained. A quarterly moderation report will be published.

### 7.4 Rating vs Reporting

- **Rating** — "how good is this?" Used for sort order, discovery feeds, adoption signals, quality filter toggle. Never deletes, never hides by default.
- **Reporting** — "does this violate the meta rules?" Triggers moderation review. Different button, different outcome.

### 7.5 Moderator Roles

- **Platform staff** — handle meta violations, policy, and appeals. Trusted, slow, limited to meta only.
- **Community volunteers** — may be added later for first-pass review. Guidelines must be published.
- **Community never deletes.** Staff never rates. Roles stay separate.

---

## 8. Technical Architecture

### 8.1 Stack

- **Frontend:** Next.js (App Router), React, Zustand or similar for state, `react-rnd` or `winbox` for window management, `react-markdown` + `remark-gfm` for record rendering.
- **Backend:** .NET 10 Minimal APIs, EF Core, PostgreSQL, SignalR for real-time email/popularity updates.
- **Search:** PostgreSQL full-text search (`tsvector`).
- **Storage:** Markdown stored as `text` in DB. Images in S3 or local blob storage.
- **Auth:** JWT. Roles: Guest, Author, Moderator.

### 8.2 The "PDF" Illusion

- Records are stored as Markdown.
- The UI renders Markdown as HTML styled to mimic paper: serif fonts, page margins, subtle texture.
- **No actual PDF viewer.** No PDF generation.

### 8.3 The Desktop Metaphor

- The CIRCA/OS desktop is the navigation.
- Icons are folders and files.
- Folders contain incidents, records, orgs, or dossiers.
- A `manifest.json` per folder (generated from the DB) tells the desktop how to render.
- Opening a record fetches Markdown and renders it as a paper document.
- An email client is available as a desktop app.
- A "Start" menu, taskbar, and window manager are needed.

### 8.4 Data Model

```
User
  id (uuid, pk)
  username
  role (guest | author | moderator)
  flair_org_id (fk, nullable, cosmetic)
  created_at

Incident
  id (uuid, pk)
  circa_code (string, unique, immutable, e.g. INC-081323)
  primary_claim_org_id (fk, nullable)
  canonical_brief (markdown, nullable)
  status (open | contested | archived)
  originator_id (fk)
  created_at

IncidentDesignation
  id (uuid, pk)
  incident_id (fk)
  org_id (fk)
  label (string, e.g. Qterw-3-7)
  created_at

Record
  id (uuid, pk)
  circa_code (string, unique, immutable, e.g. CIRCA-R-081323)
  incident_id (fk, nullable for RUMORs)
  org_id (fk, nullable)
  type (INCIDENT | DISCOVERY | EXPLORATION | RUMOR)
  author_id (fk)
  markdown (text)
  filed_status (filed | rumor | apocryphal)
  relationship (self | about | null)
  parent_record_id (fk, nullable, for forks)
  content_hash (string, for tombstone matching)
  created_at

Organization
  id (uuid, pk)
  circa_code (string, unique, immutable, e.g. CIRCA-ID-0813)
  tag_slug (string, mutable until promotion)
  name (string)
  status (tag | eligible | promoted | rejected)
  code (string, nullable, set on promotion, e.g. ORG-A-081323)
  originator_id (fk, nullable)
  vote_score (int)
  version (int)
  created_at
  promoted_at (nullable)

Dossier
  id (uuid, pk)
  org_id (fk)
  body (markdown, community-editable)
  version (int)
  last_edited_by (fk)
  last_edited_at (timestamp)

DossierRevision
  id (uuid, pk)
  dossier_id (fk)
  body (markdown)
  editor_id (fk)
  reason (text)
  created_at

OrganizationVote
  id (uuid, pk)
  org_id (fk)
  user_id (fk)
  value (int, +1 or -1)
  created_at

OrgMention
  id (uuid, pk)
  org_id (fk, nullable until identified)
  record_id (fk)
  raw_text (string)
  created_at

Recognition
  id (uuid, pk)
  recognizing_org_id (fk)
  recognized_org_id (fk)
  record_id (fk)
  approved (bool)
  created_at

RecordVote
  id (uuid, pk)
  user_id (fk)
  record_id (fk)
  value (int, +1 or -1)
  created_at

Tombstone
  id (uuid, pk)
  record_id (fk)
  reason (text, moderator-only)
  category (meta violation type)
  hash (string)
  tombstoned_by (fk)
  tombstoned_at (timestamp)

Email
  id (uuid, pk)
  from (string)
  to (string)
  subject (string)
  body (markdown)
  attachments (jsonb)
  type (system | popular | recent | case)
  created_at

Folder
  id (uuid, pk)
  name (string)
  parent_id (fk, nullable)
  owner_id (fk, nullable)
  type (incident | record | org | archive)
  ref_id (uuid, fk to referenced entity)
```

### 8.5 The ID Rule

**Store IDs, not codes, as foreign keys.**

- A record points to an org by `org_id`, never by `org_code`.
- The org code is a display attribute. It changes on promotion.
- Every record pointing at the org automatically reflects the new code.
- No re-indexing. No broken citations.
- The `circa_code` on records is immutable and is the universal deep link.

### 8.6 The Missing Pieces

- Content hash comparison on submit for tombstone matching.
- Trust score on `User` for the vote weighting (optional, not yet designed).
- `strike_count` and `last_strike_at` fields on `User`.
- Moderation log table for public reporting.
- Real-time SignalR channels for email delivery and vote count updates.

---

## 9. Discovery

### 9.1 Primary Discovery: The Email Client

- Inbox shows: **Recent Logs**, **Popular**, **System Alerts**, **Case Assignments**.
- An email from a dead reviewer pulls the user into the first case.
- Emails can have attachments (images, Markdown records).

### 9.2 Secondary Discovery

- **Search archive** — full-text search with filters by org, letter, date, character, type.
- **Browse folders** — the desktop metaphor itself.
- **Random old record button** — resurfaces forgotten files.
- **Curated collections** — users create public reading lists.
- **Citation graph** — highly-cited records stay visible.
- **Algorithmic feeds** — "because you read X."

### 9.3 The Hook

The first case is delivered via an email from a reviewer who has been dead for 30 years, attaching a record that hasn't been written yet.

---

## 10. UI/UX Principles

- **Diegetic.** Every UI element exists in the fiction.
- **Paper-like.** Records render as paper documents. Serif fonts, margins, subtle texture.
- **Desktop metaphor.** Icons, folders, windows, taskbar, start menu.
- **Two axes of navigation.** Browse by incident or by org. The incident is the hub; orgs are spokes.
- **No canon declarations.** The UI never says "this is canon." It says "this is filed."
- **Public moderation record.** Visible but not intrusive.
- **Flair is personal, tags are archival.** Never blur.

---

## 11. Vocabulary (Locked)

| Term | Meaning |
|---|---|
| **CIRCA** | The organization. Ancient continuity, not a government agency. |
| **Incident** | A ghost story. Independent entity. `INC-XXXXX`. |
| **Record** | A filed artifact. `CIRCA-X-XXXX`. |
| **Org** | A recognized entity. `ORG-X-XXXX`. |
| **Dossier** | The community-editable wiki page for an org. |
| **Continuity** | A branch of an org's story. |
| **Primary Claim** | Display convention for an incident's master file. |
| **Contested** | A valid state when two orgs claim primary. |
| **Tombstoned** | A record removed from discoverability for meta violations. |
| **Erased** | An org rejected from the directory. `CIRCA-R`. |
| **Reinstated** | An erased org returned to the directory. |
| **Flair** | Cosmetic org badge on a user's profile. |
| **Record Tag** | The org lens on a specific record. |

---

## 12. Open Questions

1. **Erased org record adoption:** Can another recognized org adopt an erased org's rumors into its own continuity? *Current lean: yes, free-form is best.*
2. **Resubmission rules:** Once an org is reinstated, can it be rejected again? *Not yet decided.*
3. **Self-deletion:** Can an author delete their own record? *Not yet decided.*
4. **Structured rules:** Should rules be extracted into a `RuleProposal` table, or left as prose? *Current lean: start with prose, add structure later.*
5. **Notification on contested incidents:** Does the primary claim holder get notified when a new org files on their incident? *Leaning yes, for drama. Not decided.*
6. **Moderation transparency:** Public moderation record format not yet designed. Quarterly report contents TBD.
7. **SignalR usage:** Confirm which real-time features are needed (email, vote counts, adoption events).
8. **Character pages:** Characters are tracked by name in records. A character page auto-generates when a name appears in N+ records. Threshold not set.
9. **First three seeded orgs:** Names, codes, voices, and vocabulary not yet written.
10. **The first incident:** Not yet written. Should be the one delivered by the dead reviewer's email.

---

## 13. What Was Rejected (and Why)

- **PDF generation** — rejected in favor of Markdown rendered as paper. Avoids pipeline complexity, keeps editing easy.
- **"Detached government agency established 100 BC"** — rejected as historically incoherent. Replaced with "ancient continuity that predates governments."
- **Handler role** — rejected. No user is authoritative over an org. Orgs are mythic, not authorial.
- **Pure populace canon** — rejected. Popularity ≠ coherence. Replaced with advisory votes + moderator confirmation.
- **Author ownership of incidents** — rejected. Authors get provenance, not control.
- **Singular canon** — rejected. No truth-maker exists. The archive files; it does not believe.
- **SCP-style deletion** — rejected. The archive is accumulative. Only meta violations are tombstoned.

---

## 14. Immediate Next Steps

1. Finalize the names, codes, and voices of the three seeded orgs.
2. Write the first incident (the one delivered via the dead reviewer's email).
3. Design the moderation public record format.
4. Decide open questions 1–5.
5. Draft the data model in full (add missing fields identified in §8.6).
6. Prototype the desktop shell in Next.js with a fake `manifest.json`-driven folder system.
7. Write the public rules page (meta violations list).

---

*This document is a living record. Every design decision should be appended here with a date and rationale. When conflicts arise between this document and prior conversations, this document wins.*
