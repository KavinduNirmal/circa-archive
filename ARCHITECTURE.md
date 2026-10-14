**DRAFT ONLY**

# CIRCA Archive — Technical Specifications

**Version:** 0.1  
**Status:** Draft  
**Date:** 2026-10-14  
**Author:** Project Muse  
**Purpose:** Technical specification for the CIRCA Archive collaborative storytelling platform.

---

## 1. Overview

CIRCA Archive is a collaborative storytelling platform where users write, explore, and expand ghost stories within a shared fictional universe. The interface mimics a desktop workstation belonging to C.I.R.C.A. (Commission for Incident Review and Corrective Action), an ancient continuity that predates governments and files records on anomalous incidents.

Users interact with a diegetic desktop environment. Records are authored in Markdown and rendered as paper-like PDFs. The platform supports exploration records, organization dossiers, voting, moderation, and a complex canon system without a central authority.

### 1.1 Core Principles

- **Diegetic UI:** Every interface element exists within the fiction.
- **No authoritative canon:** The archive files; it does not believe.
- **Accumulative archive:** Nothing is deleted except meta violations (tombstoned).
- **Orgs are mythic:** Organizations are aggregates, not institutions with owners.
- **Records are immutable in ID, mutable in filing status.**
- **Store IDs, display codes.**

---

## 2. Glossary

| Term | Definition |
|------|------------|
| **CIRCA** | Commission for Incident Review and Corrective Action. Ancient continuity, not a government agency. |
| **Incident** | A ghost story. Independent entity. Code: `INC-XXXXX`. |
| **Record** | A filed artifact. Code: `CIRCA-X-XXXX`. Types: INCIDENT, DISCOVERY, EXPLORATION, RUMOR. |
| **Org** | A recognized organization. Code: `ORG-X-XXXX`. |
| **Dossier** | Community-editable wiki page for an org. |
| **Continuity** | A branch of an org's story. Multiple coexist. |
| **Primary Claim** | Display convention for an incident's master file. Singular, cedeable. |
| **Contested** | Valid state when two orgs claim primary on an incident. |
| **Tombstoned** | A record removed from discoverability for meta violations. |
| **Erased** | An org rejected from the directory. Code: `CIRCA-R-XXXX`. |
| **Reinstated** | An erased org returned to the directory after appeal. |
| **Flair** | Cosmetic org badge on a user's profile. |
| **Record Tag** | The org lens on a specific record. |

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, Zustand, `react-rnd` / `winbox`, `react-markdown` + `remark-gfm` |
| Backend | .NET 10 Minimal APIs, EF Core |
| Database | PostgreSQL |
| Real-time | SignalR |
| Storage | S3-compatible object storage (images) |
| Auth | JWT |
| Search | PostgreSQL full-text search (`tsvector`) |

### 3.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Desktop     │  │ Email       │  │ WRITE.exe           │  │
│  │ Shell       │  │ Client      │  │ (Record Editor)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ My Records  │  │ Search      │  │ Recycle Bin         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   .NET 10 Minimal API                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Records  │ │ Orgs     │ │ Votes    │ │ Moderation    │  │
│  │ API      │ │ API      │ │ API      │ │ API           │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Email    │ │ Search   │ │ Auth     │ │ SignalR Hubs  │  │
│  │ API      │ │ API      │ │ API      │ │               │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
│  Users, Incidents, Records, Organizations, Dossiers, Votes,  │
│  Emails, Tombstones, ModerationLog, Folders                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Object Storage (S3)                        │
│  Evidence images, audio files, attachments                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Frontend Architecture

- **Next.js App Router** for routing and server components.
- **Desktop Shell** is a client component that manages window state, icons, taskbar.
- **Window Manager:** `react-rnd` for draggable, resizable windows. Or `winbox` for a more complete windowing experience.
- **State Management:** Zustand for desktop state (open windows, icon positions, active window).
- **Markdown Rendering:** `react-markdown` with `remark-gfm`. Custom CSS to mimic paper: serif fonts, page margins, subtle texture.
- **No PDF generation.** The `.pdf` extension is a diegetic lie; files are Markdown rendered as paper.

### 3.4 Backend Architecture

- **.NET 10 Minimal APIs** for REST endpoints.
- **EF Core** with PostgreSQL provider.
- **SignalR** for real-time email delivery, vote count updates, adoption events.
- **Background Services** for:
  - Content hash matching on record submission
  - Moderation log aggregation
  - Email digest generation
  - Near-identical org detection
  - Vote threshold checks

### 3.5 Database Schema

#### 3.5.1 Users

```sql
CREATE TABLE Users (
    Id UUID PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'author', -- guest, author, moderator
    FlairOrgId UUID NULL REFERENCES Organizations(Id),
    StrikeCount INT NOT NULL DEFAULT 0,
    LastStrikeAt TIMESTAMP NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.5.2 Incidents

```sql
CREATE TABLE Incidents (
    Id UUID PRIMARY KEY,
    CircaCode VARCHAR(20) NOT NULL UNIQUE, -- INC-081323
    Title VARCHAR(255),
    PrimaryClaimOrgId UUID NULL REFERENCES Organizations(Id),
    CanonicalBrief TEXT, -- markdown
    Status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, contested, archived
    OriginatorId UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IncidentDesignations (
    Id UUID PRIMARY KEY,
    IncidentId UUID NOT NULL REFERENCES Incidents(Id),
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    Label VARCHAR(100) NOT NULL, -- e.g. Qterw-3-7
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.5.3 Records

```sql
CREATE TABLE Records (
    Id UUID PRIMARY KEY,
    CircaCode VARCHAR(20) NOT NULL UNIQUE, -- CIRCA-R-081323
    IncidentId UUID NULL REFERENCES Incidents(Id),
    OrgId UUID NULL REFERENCES Organizations(Id),
    Type VARCHAR(20) NOT NULL, -- INCIDENT, DISCOVERY, EXPLORATION, RUMOR
    AuthorId UUID NOT NULL REFERENCES Users(Id),
    Markdown TEXT NOT NULL,
    FiledStatus VARCHAR(20) NOT NULL DEFAULT 'filed', -- filed, rumor, apocryphal
    Relationship VARCHAR(10) NULL, -- self, about
    ParentRecordId UUID NULL REFERENCES Records(Id),
    ContentHash VARCHAR(64) NOT NULL, -- SHA-256 of markdown
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_records_incident ON Records(IncidentId);
CREATE INDEX idx_records_org ON Records(OrgId);
CREATE INDEX idx_records_author ON Records(AuthorId);
CREATE INDEX idx_records_hash ON Records(ContentHash);
```

#### 3.5.4 Organizations

```sql
CREATE TABLE Organizations (
    Id UUID PRIMARY KEY,
    CircaCode VARCHAR(20) NOT NULL UNIQUE, -- CIRCA-ID-0813
    TagSlug VARCHAR(100) NOT NULL UNIQUE,
    Name VARCHAR(255) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'tag', -- tag, eligible, promoted, rejected
    Code VARCHAR(20) NULL UNIQUE, -- ORG-A-081323, set on promotion
    OriginatorId UUID NULL REFERENCES Users(Id),
    VoteScore INT NOT NULL DEFAULT 0,
    Version INT NOT NULL DEFAULT 1,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    PromotedAt TIMESTAMP NULL
);

CREATE TABLE Dossiers (
    Id UUID PRIMARY KEY,
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    Body TEXT NOT NULL, -- markdown
    Version INT NOT NULL DEFAULT 1,
    LastEditedBy UUID REFERENCES Users(Id),
    LastEditedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE DossierRevisions (
    Id UUID PRIMARY KEY,
    DossierId UUID NOT NULL REFERENCES Dossiers(Id),
    Body TEXT NOT NULL,
    EditorId UUID NOT NULL REFERENCES Users(Id),
    Reason TEXT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE OrganizationVotes (
    Id UUID PRIMARY KEY,
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    UserId UUID NOT NULL REFERENCES Users(Id),
    Value INT NOT NULL, -- +1 or -1
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(OrgId, UserId)
);

CREATE TABLE OrgMentions (
    Id UUID PRIMARY KEY,
    OrgId UUID NULL REFERENCES Organizations(Id),
    RecordId UUID NOT NULL REFERENCES Records(Id),
    RawText VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Recognitions (
    Id UUID PRIMARY KEY,
    RecognizingOrgId UUID NOT NULL REFERENCES Organizations(Id),
    RecognizedOrgId UUID NOT NULL REFERENCES Organizations(Id),
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Approved BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.5.5 Votes and Moderation

```sql
CREATE TABLE RecordVotes (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    UserId UUID NOT NULL REFERENCES Users(Id),
    Value INT NOT NULL, -- +1 or -1
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(RecordId, UserId)
);

CREATE TABLE Tombstones (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Reason TEXT NOT NULL,
    Category VARCHAR(50) NOT NULL, -- harassment, spam, plagiarism, etc.
    Hash VARCHAR(64) NOT NULL,
    TombstonedBy UUID NOT NULL REFERENCES Users(Id),
    TombstonedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ModerationLog (
    Id UUID PRIMARY KEY,
    Action VARCHAR(50) NOT NULL, -- tombstone, warning, ban
    Category VARCHAR(50) NOT NULL,
    AnonymizedAuthorId UUID NOT NULL,
    RecordId UUID NULL,
    Reason TEXT NOT NULL,
    ModeratorId UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.5.6 Emails and Folders

```sql
CREATE TABLE Emails (
    Id UUID PRIMARY KEY,
    FromAddress VARCHAR(255) NOT NULL,
    ToUserId UUID NOT NULL REFERENCES Users(Id),
    Subject VARCHAR(255) NOT NULL,
    Body TEXT NOT NULL, -- markdown
    Attachments JSONB,
    Type VARCHAR(20) NOT NULL, -- system, popular, recent, case, digest, dead_letter
    FiledIntoFolderId UUID NULL REFERENCES Folders(Id),
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Folders (
    Id UUID PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    ParentId UUID NULL REFERENCES Folders(Id),
    OwnerId UUID NULL REFERENCES Users(Id),
    Type VARCHAR(20) NOT NULL, -- incident, record, org, archive, user
    RefId UUID NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.6 Indexes and Constraints

- `Users.Username` unique
- `Incidents.CircaCode` unique
- `Records.CircaCode` unique
- `Organizations.CircaCode` unique
- `Organizations.Code` unique when not null
- `OrganizationVotes` unique on (OrgId, UserId)
- `RecordVotes` unique on (RecordId, UserId)
- Full-text search index on `Records.Markdown`, `Dossiers.Body`, `Incidents.CanonicalBrief`

---

## 4. API Specification

### 4.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh JWT |
| GET | `/api/auth/me` | Current user profile |

### 4.2 Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/records` | List records with filters (incident, org, type, author, status) |
| GET | `/api/records/{id}` | Get record by ID |
| GET | `/api/records/by-code/{circaCode}` | Get record by CIRCA code |
| POST | `/api/records` | Create new record |
| PATCH | `/api/records/{id}` | Update record (author only, limited fields) |
| DELETE | `/api/records/{id}` | Soft-delete (move to Recycle Bin) |
| POST | `/api/records/{id}/fork` | Fork record |
| POST | `/api/records/{id}/vote` | Vote +1/-1 |
| POST | `/api/records/{id}/report` | Report meta violation |

### 4.3 Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/{id}` | Get incident with aggregated records |
| POST | `/api/incidents` | Create incident (INCIDENT record) |
| PATCH | `/api/incidents/{id}/primary-claim` | Set primary claim org (originator, 30-day window) |
| GET | `/api/incidents/{id}/designations` | Get org designations |

### 4.4 Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orgs` | List orgs (filter by status, code) |
| GET | `/api/orgs/{id}` | Get org with dossier |
| POST | `/api/orgs` | Submit org identification (Brief, Voice, Seed) |
| POST | `/api/orgs/{id}/vote` | Vote +1/-1 |
| POST | `/api/orgs/{id}/appeal` | Submit Reclassification Petition |
| GET | `/api/orgs/{id}/dossier` | Get dossier |
| PATCH | `/api/orgs/{id}/dossier` | Edit dossier (community wiki) |
| GET | `/api/orgs/{id}/mentions` | Get records mentioning org |

### 4.5 Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | List emails (filter by type, folder) |
| GET | `/api/emails/{id}` | Get email |
| POST | `/api/emails/{id}/file` | File email into case folder |
| PATCH | `/api/emails/{id}/read` | Mark read |

### 4.6 Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moderation/log` | Public moderation log (anonymized) |
| POST | `/api/moderation/tombstone` | Tombstone record (moderator only) |
| GET | `/api/moderation/expunged/count` | Count of expunged records |

### 4.7 Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Full-text search across records, incidents, orgs |

### 4.8 Real-time (SignalR)

| Hub | Events |
|-----|--------|
| `EmailHub` | `NewEmail`, `EmailFiled` |
| `VoteHub` | `VoteCountUpdated` |
| `AdoptionHub` | `RecordAdopted`, `OrgPromoted` |

---

## 5. Desktop UI Specification

### 5.1 Desktop Layout

The desktop is the root interface. It contains icons, a taskbar, and a system tray.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CIRCA/OS — Reviewer Workstation                                    [−][□][×] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📧 Inbox          📁 Archive        📁 Organizations    📝 My Records     │
│                                                                             │
│   🔍 Search         📄 WRITE.exe      🗑️ Recycle Bin      📁 _EXPUNGED      │
│                                                                             │
│   ⚙️ System                                                                  │
│                                                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Start]  [Inbox]  [WRITE.exe]  [My Records]              🔔 3  📶  🔊  ⏰  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Desktop Icons

| Icon | Name | Type | Description |
|------|------|------|-------------|
| 📧 | Inbox | App | Email client. Hub for discovery. |
| 📁 | Archive | Folder | Every case ever filed. |
| 📁 | Organizations | Folder | Org dossiers. |
| 📝 | My Records | App | Dashboard of user's written records. |
| 🔍 | Search | App | Global search. |
| 📄 | WRITE.exe | App | Record editor. Creates new records. |
| 🗑️ | Recycle Bin | Folder | User's deleted drafts and records. Recoverable 30 days. |
| 📁 | _EXPUNGED | Folder | Always empty. Shows count of tombstoned records. |
| ⚙️ | System | Folder | CIRCA/OS lore files, help, corrupted files. |

### 5.3 Case Folder Structure

When a user opens a case folder, they see:

```
📁 CIRCA-S-1283y19
   The Black Dog
   ├── 📄 CASE_BRIEF.pdf
   ├── 📄 00_INITIAL_DISCOVERY.pdf
   ├── 📁 Records
   │   ├── 📄 LOG-001_ORG-A.pdf
   │   ├── 📧 LOG-002_ORG-B.eml
   │   ├── 📄 LOG-003_ORG-A.pdf
   │   └── 📄 LOG-001_ORG-A_F1.pdf
   ├── 📁 Rumours
   │   ├── 📝 RUM-001.txt
   │   └── 📝 RUM-002.txt
   ├── 🖼️ EVIDENCE_01.jpg
   ├── 🖼️ EVIDENCE_02.png
   └── 📄 FORK_TREE.pdf
```

**Rules:**
- Case folder name is the CIRCA code. Subtitle is the common name.
- Maximum two levels of nesting inside a case.
- Evidence sits flat.
- Forks live in `Records/` with `_F1`, `_F2` suffixes.
- `FORK_TREE.pdf` renders the branch diagram.

### 5.4 File Types and Icons

| Icon | Extension | What it is | Storage |
|------|-----------|------------|---------|
| 📄 | `.pdf` | Record (incident, discovery, exploration) | Markdown in DB, rendered as paper |
| 📧 | `.eml` | Email filed into a case | Markdown in DB |
| 📝 | `.txt` | Loose note, rumor, scrap | Markdown in DB |
| 🖼️ | `.jpg` / `.png` | Evidence photo | S3 |
| 🎵 | `.wav` | Audio evidence | S3 |
| 📁 | — | Folder | DB row |

### 5.5 Email Client

The email client is a desktop app. It has four folders:

| Folder | Description |
|--------|-------------|
| **Inbox** | Unread and recent emails. Default view. |
| **Filed** | Emails filed into cases. Auto-archived. |
| **Digests** | Moderation reports, system notices. |
| **Dead Letters** | Emails from accounts that no longer exist. Anomalous emails appear here. |

**Filing emails:** Drag an email to a case folder, or right-click → "File to case...". Once filed, it appears in the case folder as `.eml` and is removed from Inbox.

### 5.6 WRITE.exe (Record Editor)

- Off-brand MS Word icon. Tooltip: "Document editor."
- Opens a Markdown editor styled as a 90s word processor.
- User chooses:
  - Case (searchable dropdown, or create new incident)
  - Org (searchable dropdown, or create new tag)
  - Type (INCIDENT, DISCOVERY, EXPLORATION, RUMOR)
  - Relationship (self, about, or null)
- Saves as a `.pdf` into the correct folder.
- Content hash computed on save for tombstone matching.

### 5.7 My Records App

- List view (default): sortable, filterable list of user's records.
- Card view: grid of recent records with case, org, vote count.
- Filters: drafts, filed, adopted, forked, tombstoned, rumors.
- Clicking a record opens it in the reader.

### 5.8 Recycle Bin

- User's deleted drafts and records.
- Recoverable for 30 days, then permanent.
- Tombstoned records do not appear here (they are removed from discoverability entirely).

### 5.9 _EXPUNGED Folder

- Always empty.
- Folder properties show count: "47 records expunged."
- Publicly visible. No content accessible.
- Represents the archive of removed things.

### 5.10 Taskbar and Window Management

- Taskbar at bottom.
- Shows open windows as buttons.
- Start button opens a simple menu (shutdown, restart, log off).
- System tray: notifications, network, volume, clock.
- Windows are draggable, resizable, minimizable, closable.
- Double-click title bar to maximize.

---

## 6. Record Lifecycle

### 6.1 Types

| Type | Description | Who can create | Constraints |
|------|-------------|----------------|-------------|
| **INCIDENT** | Original ghost story. Bystander POV preferred. No rules. | Originator | Once per incident. |
| **DISCOVERY** | First org contact. Establishes primary claim by default. | Any author | Any org. |
| **EXPLORATION** | Everything after. Containment, follow-ups, rule-establishment. | Any author | Any org. |
| **RUMOR** | Propaganda, misinformation, unverified claims. | Any author | Attach to incident or org. |

### 6.2 Creation Flow

1. User opens `WRITE.exe`.
2. Chooses case (existing incident or creates new).
3. Chooses org (existing tag or creates new tag).
4. Chooses type.
5. Writes Markdown.
6. Saves. Record gets immutable `circa_code`.
7. If INCIDENT, user becomes Originator.
8. If DISCOVERY, may establish primary claim (first-to-file default).
9. Content hash computed.

### 6.3 Filing Status

- **filed** — normal, visible.
- **rumor** — visible, marked as rumor.
- **apocryphal** — filed but marked non-canon for a specific continuity.

### 6.4 Adoption

- A record can be adopted into an org's continuity.
- Adoption is a user action (not org action).
- Adopted records are marked with the adopting org and continuity.
- Original author retains credit.

### 6.5 Forking

- Any record can be forked.
- Fork gets new `circa_code`, inherits parent lineage.
- `parent_record_id` links to parent.
- Fork tree rendered in `FORK_TREE.pdf`.

### 6.6 Tombstoning

- Triggered by meta violation report.
- Record removed from discoverability.
- Only author can view it (via My Records → Tombstoned).
- Author notified with specific rule violated.
- Content hash stored to prevent reposting.
- Public moderation log updated (anonymized).
- Strike count incremented on user.

---

## 7. Organization Lifecycle

### 7.1 States

| State | Code | Directory | Can adopt | Notes |
|-------|------|-----------|-----------|-------|
| Tag | None | No | No | Free to create. |
| Eligible | None | No | No | Crossed threshold. |
| Promoted | `ORG-X-XXXX` | Yes | Yes | Recognized. |
| Rejected | `CIRCA-R-XXXX` | No | No | Erased. |
| Reinstated | `ORG-X-XXXX` | Yes | Yes | After successful appeal. |

### 7.2 Code Structure

- **CIRCA code:** immutable, generated at creation. `CIRCA-ID-XXXX`.
- **Org code:** assigned on promotion. `ORG-{Letter}-{Number}`.
- **Letter:** carnage rating of founding incident.
  - `U` — Unrated / Unknown
  - `S` — Singularity / Extinction-level
  - `A` — Mass casualty (100+)
  - `B` — Multiple (10–99)
  - `C` — Few (1–9)
  - `D` — No casualties
- Letter fixed at promotion.

### 7.3 Submission Format

1. **Brief** — what the org is, classification language.
2. **Voice** — one short sample record in org's voice.
3. **Seed** — one-paragraph pitch for first incident.

### 7.4 Voting

- Community votes +1/-1.
- Advisory signal, not binding.
- Thresholds:
  - Interest: 20 upvotes, 60% positive → eligible.
  - Coherence: moderator confirms consistency, distinct voice, no contradictions.

### 7.5 Outcomes

- Pass both → `ORG-A-XXXX`
- Pass interest, fail coherence → `ORG-P-XXXX` (provisional)
- Fail interest → `CIRCA-R-XXXX` (erased)

### 7.6 Appeals (Reclassification Petition)

- One appeal per rejection.
- Must include diff (what changed from v1 to v2).
- Voters see v1 and v2 side by side.
- Empty diff → auto-rejected.
- Failed appeal → 30-day lockout.

### 7.7 Near-Identical Detection

- Fuzzy match on submission.
- Does not block.
- Offers three buttons: Same org, Variant, New.
- Variant creates `ORG-A-XXXX-V1`.

---

## 8. Canon and Continuity

### 8.1 No Authoritative Canon

- No single canon.
- Terms: Recognized, Adopted, Continuity, Filed.

### 8.2 Orgs as Mythic Aggregates

- No coherent voice.
- Voice emerges from aggregate writing.
- Contradictions normal.

### 8.3 Continuities

- Multiple continuities per org: `ORG-A-081323/C1`, `C2`.
- Readers subscribe to continuity.

### 8.4 Erased Orgs

- Cannot adopt, recognize, or hold continuities.
- Records remain visible as rumors.
- Other orgs can adopt erased org's rumors into their own continuities.

---

## 9. Moderation

### 9.1 Meta vs In-World

**Meta violations — tombstoned:**
- Harassment
- Spam
- Plagiarism
- Illegal content
- Hate speech
- Rating gaming

**In-world content — filed:**
- Propaganda
- Contradictions
- Low-effort
- Offensive fiction within fiction
- Rumors

### 9.2 Tombstoning

- Removed from discoverability.
- Author-only view.
- Author notified.
- No appeals.
- Content hash stored.
- Strike count on dashboard.
- Public moderation log (anonymized).

### 9.3 Rating vs Reporting

- **Rating:** +1/-1. Used for sort order, discovery feeds, adoption signals, quality filter toggle.
- **Reporting:** Triggers moderation review.

### 9.4 Moderator Roles

- **Platform staff:** Meta violations, policy, appeals.
- **Community volunteers:** May be added later for first-pass review.
- Community never deletes. Staff never rates.

---

## 10. Search and Discovery

### 10.1 Email Client as Hub

- Inbox: recent, popular, system alerts, case assignments.
- Dead Letters: anomalous emails.
- Digests: moderation reports.

### 10.2 Global Search

- Full-text search across records, incidents, orgs.
- Filters: org, letter, date, character, type, author.

### 10.3 Other Discovery

- Random old record button.
- Curated collections.
- Citation graph.
- Algorithmic feeds.

---

## 11. Security and Auth

- JWT-based auth.
- Roles: guest, author, moderator.
- Rate limiting on votes, reports, submissions.
- Content hashing for tombstone matching.
- S3 signed URLs for evidence.

---

## 12. Deployment and Infrastructure

- **Frontend:** Vercel or Node.js hosting.
- **Backend:** Docker container on cloud VM or Kubernetes.
- **Database:** Managed PostgreSQL (e.g., AWS RDS, Supabase).
- **Storage:** S3-compatible.
- **SignalR:** Azure SignalR Service or self-hosted.
- **CI/CD:** GitHub Actions.

---

## 13. Open Questions

1. Can another recognized org adopt an erased org's rumors? *Leaning yes.*
2. Can an org be rejected again after reinstatement?
3. Can an author delete their own record permanently?
4. Should rules be extracted into a `RuleProposal` table?
5. Does the primary claim holder get notified when a new org files on their incident? *Leaning yes.*
6. Public moderation record format not yet finalized.
7. Character pages: threshold for auto-generation not set.
8. First three seeded orgs: names, codes, voices not written.
9. First incident: not written.
10. Taskbar behavior: single-window or multi-window? *Leaning multi-window.*

---

## 14. Appendices

### 14.1 ID Formats

| Entity | Format | Example |
|--------|--------|---------|
| Incident | `INC-{Number}` | `INC-081323` |
| Record | `CIRCA-{Type}-{Number}` | `CIRCA-R-081323` |
| Org (pre-promotion) | `CIRCA-ID-{Number}` | `CIRCA-ID-0813` |
| Org (post-promotion) | `ORG-{Letter}-{Number}` | `ORG-A-081323` |
| Org (rejected) | `CIRCA-R-{Number}` | `CIRCA-R-1000` |

### 14.2 File Extensions

| Extension | Meaning |
|-----------|---------|
| `.pdf` | Record (Markdown rendered as paper) |
| `.eml` | Filed email |
| `.txt` | Rumor, note, scrap |
| `.jpg` / `.png` | Evidence photo |
| `.wav` | Audio evidence |

### 14.3 Desktop Icon List

- 📧 Inbox
- 📁 Archive
- 📁 Organizations
- 📝 My Records
- 🔍 Search
- 📄 WRITE.exe
- 🗑️ Recycle Bin
- 📁 _EXPUNGED
- ⚙️ System

---

*This document is a living specification. All decisions are subject to revision as the project evolves.*
