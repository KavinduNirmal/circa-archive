**DRAFT ONLY**

# CIRCA Archive — Technical Specifications

**Version:** 0.2  
**Status:** Draft  
**Date:** 2026-10-21  
**Author:** Project Muse  
**Purpose:** Technical specification for the CIRCA Archive collaborative storytelling platform.

> **Revision note (2026-10-21).** This pass incorporates the private development notes on entity types, record types, and platform regulations: typed `[[wikilinks]]`, the draft entity registry, characters and recoveries as first-class entities, revised record taxonomy and identifiers, content warnings, access policy, reviewer assessment, incident playlists, and the public collaboration regulations. Where these notes conflict with earlier draft decisions, this document records the new direction and flags the unresolved remainder rather than silently reconciling it.

---

## 1. Overview

CIRCA Archive is a collaborative storytelling platform where users write, explore, and expand ghost stories within a shared fictional universe. The interface mimics a desktop workstation belonging to C.I.R.C.A. (Commission for Incident Review and Corrective Action), an ancient continuity that predates governments and files records on anomalous incidents.

Users interact with a diegetic desktop environment. Records are authored in Markdown and rendered as paper-like PDFs. The planned platform supports incidents, explorations, evidence, rumours, organization dossiers, characters, recoveries, assessment, moderation, and multiple continuities without a single authority over fictional truth. Authors connect filings with typed `[[wikilinks]]` and may introduce temporary entities from an in-editor registry; submission validates every reference and promotes temporary entities atomically so that no orphaned portfolio entries survive a failed filing. The [Author guide](docs/AUTHOR_GUIDE.md) defines the current pre-release collaboration framework and supersedes older descriptions of unrestricted incident-rule changes or automatic continuity creation; the workflows remain unimplemented.

### 1.1 Core Principles

- **Diegetic UI:** Every interface element exists within the fiction.
- **No authoritative canon:** The archive files; it does not believe.
- **Accumulative archive:** Nothing is deleted except meta violations (tombstoned).
- **Orgs are mythic:** Organizations are aggregates, not institutions with owners.
- **Records are immutable in ID, mutable in filing status.**
- **Store IDs, display codes.**
- **References are validated, not trusted.** A filing resolves every typed link inside one transaction; temporary entities either all become permanent or none do.
- **No filing is authoritative.** Authorship, assessment, and curated playlists do not determine fictional truth.
- **Consent travels with characters.** A character is imported for one draft, not licensed in perpetuity; Restricted is the default usage policy.

---

## 2. Glossary

| Term                | Definition                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **CIRCA**           | Commission for Incident Review and Corrective Action. Ancient continuity, not a government agency.                |
| **Incident**        | An anchored supernatural system, distinct from its actors. Code: `INC-{NNNNNN}`.                                  |
| **Record**          | A filed artifact against an Incident. Types: INCIDENT, EXPLORATION, EVIDENCE, RUMOUR.                             |
| **Exploration**     | A deliberate expedition into an Incident, filed as `EXP-{NNNNNN}`.                                                |
| **Evidence**        | Witness statement, interview, document, image, or other account filed as `EVI-{NNNNNN}`.                          |
| **Rumour**          | Unverified speculation filed against an Incident. Has no inherent archive code and is shown in a separate tab.    |
| **Recovery / Item** | An object or material recovered from an Incident. Code: `ITM-{NNNNNN}`.                                           |
| **Org**             | An in-universe body aware of Incidents and active in researching or managing them. Code: `ORG-{NNNNNN}`.          |
| **Character**       | A person, entity, or role authored as a reusable archive entity. Code: `CHR-{NNNNNN}`.                            |
| **Dossier**         | Community-maintained organization page, edited by appointed moderators.                                           |
| **Continuity**      | A connected sequence for an Incident or organization. Principal and divergent sequences coexist.                  |
| **Primary Claim**   | Display convention for an incident's master file. Singular, cedeable.                                             |
| **Incident Claim**  | The organization that has claimed an Incident as its own territory; `CIRCA` by default.                           |
| **Contested**       | Valid state when two orgs claim primary on an incident.                                                           |
| **Tombstoned**      | A record removed from discoverability for meta violations.                                                        |
| **Erased**          | An entity whose registry status is retired. The identifier is permanently occupied; the entity is not rendered.   |
| **Recognition**     | Community-confirmed acceptance of an organization. The organization may exist while unrecognized.                 |
| **Flair**           | Cosmetic org badge on a user's profile.                                                                           |
| **Wikilink**        | Typed inline reference such as `[[INC-008928]]`, resolved at submission against permanent archive entities.       |
| **Entity Registry** | Editor sidepanel for importing entities and minting temporary `TEMP-[TYPE]-[NUMBER]` entities for one draft.      |
| **Holder Code**     | Cosmetic organization-specific code (`PREFIX`, `NUMBER`, `SUFFIX`, `SEVERITY`) pointing at the archive reference. |
| **Access Policy**   | `public`, `sealed` (request permission), or `restricted` (platform denied).                                       |
| **Assessment**      | A reader's `Corroborate` or `Contest` vote. Advisory; never establishes truth.                                    |
| **Playlist**        | An author's curated reading order for filings against an Incident. Several playlists may coexist.                 |

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer     | Technology                                                                                    |
| --------- | --------------------------------------------------------------------------------------------- |
| Frontend  | Next.js (App Router), React, Zustand, `react-rnd` / `winbox`, `react-markdown` + `remark-gfm` |
| Backend   | .NET 10 Minimal APIs, EF Core                                                                 |
| Database  | PostgreSQL                                                                                    |
| Real-time | SignalR                                                                                       |
| Storage   | S3-compatible object storage (images)                                                         |
| Auth      | JWT                                                                                           |
| Search    | PostgreSQL full-text search (`tsvector`)                                                      |

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
│  Users, Incidents, Records, Organizations, Characters,      │
│  Recoveries, Drafts, EntityLinks, Assessments, Playlists,    │
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
- **Desktop Shell** is a client component mounted by the workspace layout. The layout, not a page, is what keeps windows and the post screen alive across a desktop URL change.
- **Window Manager:** plain absolutely-positioned frames driven by pointer gestures, because `react-rnd` always writes its own `transform` and double-applies a controlled position. The dependency is installed but unused; windows are clamped to the desktop layer and commit geometry once on release.
- **State Management:** Zustand, implemented as a store factory plus a per-workspace provider. It owns open windows, focus, geometry, stacking, the reader trail, the CRT preference, and the measured area; `sessionStorage` restores it per tab, and the URL is written by one adapter from the store's history intent.
- **Deep links:** `/{lang}/desktop/{destination}` and `/{lang}/desktop/record/{code}` are workspace positions, `noindex`, and never the canonical record address — `/{lang}/site/records/{code}` stays the publication edition.
- **Markdown Rendering:** `react-markdown` with `remark-gfm`. Custom CSS to mimic paper: serif fonts, page margins, subtle texture.
- **No PDF generation.** The `.pdf` extension is a diegetic lie; files are Markdown rendered as paper.
- **Authoring surface (`WRITE.exe`):** a Markdown editor with a right-hand **Entity Registry** sidepanel. The panel has two jobs: import existing characters, organizations, recoveries, incidents, and records; or mint temporary entities for the current draft. The editor offers `[[` completion for known references and marks unresolved tokens inline.
- **Draft isolation:** temporary entities and character imports belong to the draft id, not to the author's profile. Leaving the draft or failing submission must not leak them into the permanent registry. A successful submission promotes temporary entities, rewrites tokens to permanent codes, and notifies imported character owners.
- **Restricted character warning:** importing a character whose usage policy is `restricted` opens an acknowledgement dialog. The dialog states that characterization, history, relationships, and narrative agency remain subject to the Character Usage Guidelines, that the owner will be notified on submission, and that confirmed violations may lead to review or a content strike.
- **Editor validation:** the client can preview links and surface missing codes, but the server owns authoritative resolution. Submission is all-or-nothing.

### 3.4 Backend Architecture

- **.NET 10 Minimal APIs** for REST endpoints.
- **EF Core** with PostgreSQL provider.
- **SignalR** for real-time email delivery, assessment count updates, adoption events, and character-owner notifications.
- **Submission pipeline (transactional):** parse Markdown and typed wikilinks → validate target existence and visibility → validate character imports and record permissions → allocate permanent identifiers for temporary entities → replace draft tokens with permanent codes → compute content hash → persist the record, its links, playlists membership, and revision 1 → enqueue owner notifications. Any failure rolls back every step, including entity promotion.
- **Identifier allocation:** per-type sequences with reserved ranges and a minimum display width of six digits. The sequence value is permanently consumed even if the entity is later erased.
- **Holder codes:** resolved at filing time from the owning organization's `{PREFIX}{NUMBER}{SUFFIX}` and severity format. Holder codes are cosmetic aliases; the archive reference remains the canonical link target.
- **Background Services** for:
  - Content hash matching on record submission
  - Duplicate and near-identical entity detection
  - Moderation log aggregation
  - Email digest generation
  - Assessment threshold checks (`Disputed` advisory)
  - Character-owner notification delivery
  - Sealed-access request expiry

### 3.5 Database Schema

The schema below has been revised for the entity and reference model in the 2026-10-21 development notes. The core archive entity tables and their search indexes are now scaffolded in `Circa.Archive.Domain` and `Circa.Archive.Infrastructure`; global search is implemented; archive CRUD and destination read endpoints remain pending. The remaining schema is still conceptual: it does not yet model versioned foundational constraints, scoped Continuity Stewards and succession, or separate publication, evidentiary, and per-continuity adoption states. Temporary-entity promotion and reference resolution are specified as transactional behavior, but their exact EF Core mapping remains undecided.

Naming below is provisional. `Records` means filings against an Incident (`EXP`, `EVI`, `RUM`); the originating Incident remains its own table. `Recoveries` is the archive term for items and appears as `ITM` in display codes.

#### 3.5.1 Users

```sql
-- Conceptual auth.users shape; ASP.NET Core Identity adds normalized names,
-- credential/lockout fields and concurrency stamps. See AuthDbContext for mapping.
CREATE TABLE Users (
    Id UUID PRIMARY KEY, -- UUIDv7 for new accounts; legacy IDs remain valid
    Username VARCHAR(256) NOT NULL, -- new usernames validate at 3–20 characters
    NormalizedUsername VARCHAR(256) UNIQUE,
    Email VARCHAR(256) NOT NULL,
    NormalizedEmail VARCHAR(256) UNIQUE,
    PasswordHash TEXT NOT NULL,
    DisplayId VARCHAR(9) NOT NULL UNIQUE,
    DisplayName VARCHAR(64) NOT NULL, -- non-unique generated analyst name
    AdoptedOrganizationId UUID NULL, -- shared cosmetic flair; null = my.circa.archive
    Role VARCHAR(20) NOT NULL DEFAULT 'author',
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    IsBanned BOOLEAN NOT NULL DEFAULT FALSE,
    StrikeCount INT NOT NULL DEFAULT 0, -- capped at five; fifth strike bans
    LastStrikeAt TIMESTAMPTZ NULL,
    RestrictedUntil TIMESTAMPTZ NULL,
    CreatedAt TIMESTAMPTZ NOT NULL,
    UpdatedAt TIMESTAMPTZ NOT NULL,
    DeletedAt TIMESTAMPTZ NULL,
    LastLoginAt TIMESTAMPTZ NULL,
    LastLogoutAt TIMESTAMPTZ NULL,
    ActivityIPList TEXT[] NOT NULL -- ten most recent distinct login IPs
);
-- DisplayEmail derives from DisplayId + '@my.circa.archive'; never authenticates.
```

#### 3.5.2 Incidents

```sql
CREATE TABLE Incidents (
    Id UUID PRIMARY KEY, -- UUIDv7; never the display identifier
    ReferenceNumber BIGINT NOT NULL UNIQUE, -- INC-{minimum six digits}; 0-07539 reserved
    Severity VARCHAR(2) NOT NULL, -- E, D, C, B, A, S, O, U
    Designation VARCHAR(256) NOT NULL,
    Markdown TEXT NOT NULL, -- 2,500 words / 15,000 characters
    AuthorId UUID NOT NULL REFERENCES Users(Id),
    AuthorAffiliationOrgId UUID NULL REFERENCES Organizations(Id), -- null = CIRCA
    ClaimOrgId UUID NULL REFERENCES Organizations(Id), -- null = CIRCA
    AccessPolicy VARCHAR(20) NOT NULL DEFAULT 'public', -- public, sealed, restricted
    Classification SMALLINT NULL CHECK (Classification BETWEEN 3 AND 6),
    WarningTier VARCHAR(10) NULL, -- red, yellow, green
    WarningDisclosure VARCHAR(20) NOT NULL DEFAULT 'not_provided',
    WarningTags TEXT[] NOT NULL DEFAULT '{}',
    HolderCode VARCHAR(40) NULL, -- cosmetic organization code
    RecordStatus VARCHAR(20) NOT NULL DEFAULT 'on_file', -- on_file, erased
    ContentHash VARCHAR(64) NOT NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IncidentDesignations (
    Id UUID PRIMARY KEY,
    IncidentId UUID NOT NULL REFERENCES Incidents(Id),
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    Label VARCHAR(100) NOT NULL, -- e.g. Qterw-3-7
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IncidentRevisions (
    Id UUID PRIMARY KEY,
    IncidentId UUID NOT NULL REFERENCES Incidents(Id),
    Markdown TEXT NOT NULL,
    EditorId UUID NOT NULL REFERENCES Users(Id),
    Reason TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Display rules:

- Codes are unique, but never database keys. Every table keys on UUIDv7.
- Reserved ranges return `200` with `Missing Record`, not `404`. A `404` means the identifier exists and the archive does not hold it.
- `erased` consumes the number permanently while the row is removed from rendering.
- `sealed` withholds the body on first fetch until an access request is approved; `restricted` returns `401` with the diegetic clearance notice.
- `WarningDisclosure` distinguishes `none` (author selected no warnings), `no_warnings_apply` (author confirms the listed warnings do not apply), and `not_provided` (author did not decide). These are not interchangeable.

#### 3.5.3 Records

```sql
CREATE TABLE Records (
    Id UUID PRIMARY KEY, -- UUIDv7
    RecordType VARCHAR(10) NOT NULL, -- EXP, EVI, RUM
    ReferenceNumber BIGINT NOT NULL, -- per-type sequence; RUM still consumes a row number
    Code VARCHAR(20) NULL UNIQUE, -- EXP-{minimum six digits}, EVI-{minimum six digits}; null for RUM
    IncidentId UUID NOT NULL REFERENCES Incidents(Id), -- "filed against"
    AuthorId UUID NOT NULL REFERENCES Users(Id),
    AuthorAffiliationOrgId UUID NULL REFERENCES Organizations(Id),
    Markdown TEXT NOT NULL,
    FollowsRecordId UUID NULL REFERENCES Records(Id), -- narrative continuation
    AccessPolicy VARCHAR(20) NOT NULL DEFAULT 'public',
    Classification SMALLINT NULL CHECK (Classification BETWEEN 3 AND 6),
    WarningTier VARCHAR(10) NULL,
    WarningDisclosure VARCHAR(20) NOT NULL DEFAULT 'not_provided',
    WarningTags TEXT[] NOT NULL DEFAULT '{}',
    HolderCode VARCHAR(40) NULL,
    RecordStatus VARCHAR(20) NOT NULL DEFAULT 'on_file',
    ContentHash VARCHAR(64) NOT NULL, -- SHA-256 of markdown
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(RecordType, ReferenceNumber)
);

CREATE TABLE RecordRevisions (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Markdown TEXT NOT NULL,
    EditorId UUID NOT NULL REFERENCES Users(Id),
    Reason TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE RecordTags (
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Tag VARCHAR(64) NOT NULL,
    PRIMARY KEY(RecordId, Tag)
);

CREATE TABLE RecordAssessments (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    UserId UUID NOT NULL REFERENCES Users(Id),
    Assessment VARCHAR(20) NOT NULL, -- corroborate, contest
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(RecordId, UserId)
);

CREATE TABLE RecordAccessRequests (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    RequesterId UUID NOT NULL REFERENCES Users(Id),
    Status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, denied, expired
    DecidedBy UUID NULL REFERENCES Users(Id),
    DecidedAt TIMESTAMPTZ NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE Playlists (
    Id UUID PRIMARY KEY,
    IncidentId UUID NOT NULL REFERENCES Incidents(Id),
    AuthorId UUID NOT NULL REFERENCES Users(Id),
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE PlaylistItems (
    Id UUID PRIMARY KEY,
    PlaylistId UUID NOT NULL REFERENCES Playlists(Id),
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Position INT NOT NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(PlaylistId, RecordId)
);

CREATE INDEX idx_records_incident ON Records(IncidentId);
CREATE INDEX idx_records_author ON Records(AuthorId);
CREATE INDEX idx_records_hash ON Records(ContentHash);
CREATE INDEX idx_records_assessment ON RecordAssessments(RecordId);
CREATE INDEX idx_playlists_incident ON Playlists(IncidentId);
```

A `Disputed` advisory is computed, not stored as truth: at least ten total assessments and 70% or more `Contest` produce the archival notice. Assessment never establishes factual status. Rumours have no inherent code but still occupy a numeric sequence so that display ordering and links remain stable once the link format is settled.

#### 3.5.4 Organizations

```sql
CREATE TABLE Organizations (
    Id UUID PRIMARY KEY, -- UUIDv7
    ReferenceNumber BIGINT NOT NULL UNIQUE, -- ORG-{minimum six digits}; 0-5428 reserved
    Name VARCHAR(255) NOT NULL,
    EstablishedYear INT NULL,
    RecognizedYear INT NULL,
    RecognitionState VARCHAR(20) NOT NULL DEFAULT 'unrecognized', -- recognized, unrecognized
    FiledById UUID NOT NULL REFERENCES Users(Id),
    FiledAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    GeographicInfluence TEXT,
    PersonnelCount INT NULL,
    LogoObjectKey TEXT NULL,
    Gallery JSONB NOT NULL DEFAULT '[]',
    OrganizationType VARCHAR(20) NULL, -- government, private, religious
    Markdown TEXT NOT NULL DEFAULT '', -- 10,000 words
    SeverityWords JSONB NOT NULL DEFAULT '[]', -- custom severity vocabulary, max 10 chars each
    EmailLocalPart VARCHAR(64) NULL, -- replaces my.circa.archive for adopters
    HolderCodeFormat JSONB NULL, -- {prefix, number, suffix, severity, arrangement}
    RecordStatus VARCHAR(20) NOT NULL DEFAULT 'on_file',
    VoteScore INT NOT NULL DEFAULT 0,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE OrganizationModerators (
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    UserId UUID NOT NULL REFERENCES Users(Id),
    AppointedById UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(OrgId, UserId)
);

CREATE TABLE OrganizationRevisions (
    Id UUID PRIMARY KEY,
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    Markdown TEXT NOT NULL,
    EditorId UUID NOT NULL REFERENCES Users(Id),
    Reason TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE OrganizationVotes (
    Id UUID PRIMARY KEY,
    OrgId UUID NOT NULL REFERENCES Organizations(Id),
    UserId UUID NOT NULL REFERENCES Users(Id),
    Value INT NOT NULL, -- +1 or -1
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(OrgId, UserId)
);

CREATE TABLE OrgMentions (
    Id UUID PRIMARY KEY,
    OrgId UUID NULL REFERENCES Organizations(Id),
    RecordId UUID NULL REFERENCES Records(Id),
    IncidentId UUID NULL REFERENCES Incidents(Id),
    RawText VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE Recognitions (
    Id UUID PRIMARY KEY,
    RecognizingOrgId UUID NOT NULL REFERENCES Organizations(Id),
    RecognizedOrgId UUID NOT NULL REFERENCES Organizations(Id),
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Approved BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Recognition is a community vote, not a promotion ladder. An organization exists while `unrecognized` and is adoptable; recognition changes directory standing, not authorship or ownership. The earlier tag → eligible → promoted → rejected model is superseded by this section. Its `ORG-{Letter}-{Number}` carnage letter and `CIRCA-R-` erased codes are retained only for existing identifiers and are not assigned to new organizations.

Organization moderators may update the organization page and dossier. They do not gain platform moderation powers, foundational amendment authority, or control over adopters' records. Custom severity words and holder-code formats are cosmetic configuration.

#### 3.5.5 Characters

```sql
CREATE TABLE Characters (
    Id UUID PRIMARY KEY, -- UUIDv7
    ReferenceNumber BIGINT NOT NULL UNIQUE, -- CHR-{minimum six digits}; 0-18256 reserved
    Name VARCHAR(120) NOT NULL,
    Metadata JSONB NOT NULL DEFAULT '[]', -- author-defined sections and key/value rows
    Markdown TEXT NOT NULL, -- 10,000 words
    CreatedById UUID NOT NULL REFERENCES Users(Id),
    UsagePolicy VARCHAR(20) NOT NULL DEFAULT 'restricted', -- restricted, open
    RecordStatus VARCHAR(20) NOT NULL DEFAULT 'on_file',
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE CharacterImports (
    Id UUID PRIMARY KEY,
    DraftId UUID NOT NULL REFERENCES Drafts(Id),
    CharacterId UUID NOT NULL REFERENCES Characters(Id),
    ImportedById UUID NOT NULL REFERENCES Users(Id),
    RestrictedAcknowledgedAt TIMESTAMPTZ NULL,
    OwnerNotifiedAt TIMESTAMPTZ NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(DraftId, CharacterId)
);
```

`Open` allows another author to adopt the character into a record and alter personality, history, or even kill them within that continuity. `Restricted` is the default: the character may be referenced, but characterization, established history, relationships, and narrative agency remain subject to the Character Usage Guidelines; the owner is notified on submission and may request review. Importing a restricted character requires an explicit acknowledgement stored on `CharacterImports`.

The earlier three-value permission model (Open / Permission Required / Reference Only) is superseded by `restricted | open`. The stricter `Reference Only` behavior may be reintroduced as a narrower scope, but the development notes do not define it.

#### 3.5.6 Recoveries (Items)

```sql
CREATE TABLE Recoveries (
    Id UUID PRIMARY KEY, -- UUIDv7
    ReferenceNumber BIGINT NOT NULL UNIQUE, -- ITM-{minimum six digits}
    Name VARCHAR(255) NOT NULL,
    AlternativeNames TEXT[] NOT NULL DEFAULT '{}',
    Category VARCHAR(20) NOT NULL, -- object, document, substance, organism, material, other, undetermined
    Description TEXT NOT NULL, -- 5,000 words
    OriginIncidentId UUID NULL REFERENCES Incidents(Id),
    FirstDocumentedRecordId UUID NULL REFERENCES Records(Id),
    RegisteredById UUID NOT NULL REFERENCES Users(Id),
    DocumentationStatus VARCHAR(20) NOT NULL DEFAULT 'basic', -- basic, documented
    RegistryStatus VARCHAR(20) NOT NULL DEFAULT 'active', -- active, erased
    Metadata JSONB NOT NULL DEFAULT '[]',
    Gallery JSONB NOT NULL DEFAULT '[]',
    FirstRecoveredByCharacterId UUID NULL REFERENCES Characters(Id),
    FirstRecoveredByOrgId UUID NULL REFERENCES Organizations(Id),
    CurrentCustodianCharacterId UUID NULL REFERENCES Characters(Id),
    CurrentCustodianOrgId UUID NULL REFERENCES Organizations(Id),
    CustodyStatus VARCHAR(20) NOT NULL DEFAULT 'unknown', -- unknown, unclaimed, claimed, disputed, lost, destroyed
    Reproducibility VARCHAR(20) NOT NULL DEFAULT 'unknown', -- unknown, unique, repeatable
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Recoveries are in-world entities, not records: a record can document a recovery, but the recovery has its own registry page and references. The custody fields are nullable because "first recovered by" and "current custodian" may be unknown or disputed.

#### 3.5.7 Drafts, temporary entities, and reference links

```sql
CREATE TABLE Drafts (
    Id UUID PRIMARY KEY, -- UUIDv7
    AuthorId UUID NOT NULL REFERENCES Users(Id),
    RecordType VARCHAR(10) NOT NULL, -- INC, EXP, EVI, RUM
    IncidentId UUID NULL REFERENCES Incidents(Id),
    Markdown TEXT NOT NULL,
    AccessPolicy VARCHAR(20) NOT NULL DEFAULT 'public',
    WarningTier VARCHAR(10) NULL,
    WarningDisclosure VARCHAR(20) NOT NULL DEFAULT 'not_provided',
    WarningTags TEXT[] NOT NULL DEFAULT '{}',
    Status VARCHAR(20) NOT NULL DEFAULT 'editing', -- editing, submitted, discarded
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE TemporaryEntities (
    Id UUID PRIMARY KEY,
    DraftId UUID NOT NULL REFERENCES Drafts(Id),
    TempCode VARCHAR(20) NOT NULL, -- TEMP-EVI-01, TEMP-CHR-01, TEMP-ORG-01, TEMP-ITM-01
    EntityType VARCHAR(20) NOT NULL, -- incident, evidence, exploration, rumour, organization, character, recovery
    Name VARCHAR(255) NOT NULL,
    Payload JSONB NOT NULL DEFAULT '{}',
    ImageObjectKey TEXT NULL,
    PromotedEntityId UUID NULL,
    PromotedAt TIMESTAMPTZ NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(DraftId, TempCode)
);

CREATE TABLE EntityLinks (
    Id UUID PRIMARY KEY,
    DraftId UUID NULL REFERENCES Drafts(Id),
    SourceRecordId UUID NULL REFERENCES Records(Id),
    SourceIncidentId UUID NULL REFERENCES Incidents(Id),
    TargetType VARCHAR(20) NOT NULL, -- incident, evidence, exploration, rumour, organization, character, recovery
    TargetId UUID NOT NULL,
    RawLink VARCHAR(64) NOT NULL, -- e.g. INC-008928
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (DraftId IS NOT NULL OR SourceRecordId IS NOT NULL OR SourceIncidentId IS NOT NULL)
);

CREATE INDEX idx_entity_links_target ON EntityLinks(TargetType, TargetId);
CREATE INDEX idx_temporary_entities_draft ON TemporaryEntities(DraftId);
```

Submission is the only place where a draft becomes permanent. A single transaction validates links and permissions, promotes temporary entities, rewrites temporary tokens to permanent codes, writes revision 1, and moves draft links onto the new record. If anything fails, the whole draft remains editable and no permanent entity is created. This prevents orphaned organizations, characters, recoveries, or evidence from failed filings.

#### 3.5.8 Moderation and appeals

```sql
CREATE TABLE Tombstones (
    Id UUID PRIMARY KEY,
    RecordId UUID NOT NULL REFERENCES Records(Id),
    Reason TEXT NOT NULL,
    Category VARCHAR(50) NOT NULL, -- harassment, spam, plagiarism, etc.
    Hash VARCHAR(64) NOT NULL,
    TombstonedBy UUID NOT NULL REFERENCES Users(Id),
    TombstonedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ModerationLog (
    Id UUID PRIMARY KEY,
    Action VARCHAR(50) NOT NULL, -- tombstone, warning, restriction, suspension, removal
    Category VARCHAR(50) NOT NULL,
    AnonymizedAuthorId UUID NOT NULL,
    RecordId UUID NULL,
    Reason TEXT NOT NULL,
    ModeratorId UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ModerationAppeals (
    Id UUID PRIMARY KEY,
    ModerationLogId UUID NOT NULL REFERENCES ModerationLog(Id),
    AppellantId UUID NOT NULL REFERENCES Users(Id),
    Statement TEXT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, upheld, overturned
    DecidedBy UUID NULL REFERENCES Users(Id),
    DecidedAt TIMESTAMPTZ NULL,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`RecordVotes` is superseded by `RecordAssessments`. Assessment values are `corroborate | contest`, not numeric +1/-1; negative assessment produces an advisory, never removal. The platform regulations permit appeals except where legal, safety, or abuse-prevention constraints require otherwise, so tombstoning is no longer described as appeal-free.

#### 3.5.9 Emails and Folders

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

- `Users.NormalizedUsername`, `Users.NormalizedEmail`, and `Users.DisplayId` unique
- `Incidents.ReferenceNumber` unique
- `Records(RecordType, ReferenceNumber)` unique; `Records.Code` unique when not null
- `Organizations.ReferenceNumber` unique
- `Characters.ReferenceNumber` unique
- `Recoveries.ReferenceNumber` unique
- `OrganizationVotes` unique on (OrgId, UserId)
- `RecordAssessments` unique on (RecordId, UserId)
- `CharacterImports` unique on (DraftId, CharacterId)
- `TemporaryEntities` unique on (DraftId, TempCode)
- `PlaylistItems` unique on (PlaylistId, RecordId)
- Reserved display ranges: Incidents `0-07539`, Explorations `0-288901`, Evidence `0-35782`, Organizations `0-5428`, Characters `0-18256`
- Full-text search index on `Incidents.Markdown`, `Records.Markdown`, `Organizations.Markdown`, and `Characters.Markdown`
- Search over classification and status uses display vocabulary, not internal enum names
- Stored `search_text` and GIN trigram indexes cover all five entity types; recovery text includes alternative names
- Stored English `search_vector` and GIN indexes cover all five entity types
- Case-insensitive holder prefixes use SQL expression indexes on `lower(holder_code) text_pattern_ops`
- Search DDL includes `record_assessments`, `record_access_requests`, and `tombstones`, with unique assessments and approved-reader/tombstone lookup indexes
- Organizations preserve an optional unique `legacy_code` display alias; canonical references remain stable

---

## 4. API Specification

### 4.0 Versioning

All endpoints are versioned via the URL path segment (`/api/v{version}/...`). The current version is **v1**. Each response includes an `api-supported-versions` header advertising all active versions. New versions are additive; breaking changes require a new version number.

### 4.1 Authentication

| Method | Endpoint                | Description                                                           |
| ------ | ----------------------- | --------------------------------------------------------------------- |
| POST   | `/api/v1/auth/register` | Create account                                                        |
| POST   | `/api/v1/auth/login`    | Login, sets HttpOnly access and refresh cookies; returns user summary |
| POST   | `/api/v1/auth/refresh`  | Rotate refresh cookie and issue access cookie (204)                   |
| GET    | `/api/v1/auth/me`       | Current user profile                                                  |

### 4.2 Records

| Method | Endpoint                              | Description                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/v1/records`                     | List records with filters (incident, type, author, status, tags)   |
| GET    | `/api/v1/records/{id}`                | Get record by ID                                                   |
| GET    | `/api/v1/records/by-code/{code}`      | Get record by display code; reserved codes return `Missing Record` |
| POST   | `/api/v1/records`                     | Submit a draft atomically                                          |
| PATCH  | `/api/v1/records/{id}`                | Revise record (author; creates a revision)                         |
| DELETE | `/api/v1/records/{id}`                | Erase record; the number remains occupied                          |
| POST   | `/api/v1/records/{id}/fork`           | Fork record                                                        |
| POST   | `/api/v1/records/{id}/assess`         | Corroborate or contest                                             |
| DELETE | `/api/v1/records/{id}/assess`         | Remove own assessment                                              |
| GET    | `/api/v1/records/{id}/revisions`      | List revisions                                                     |
| POST   | `/api/v1/records/{id}/access-request` | Request access to a sealed record                                  |
| POST   | `/api/v1/records/{id}/report`         | Report meta violation                                              |

### 4.3 Incidents

| Method | Endpoint                               | Description                                           |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| GET    | `/api/v1/incidents`                    | List incidents                                        |
| GET    | `/api/v1/incidents/{id}`               | Get incident with aggregated records                  |
| POST   | `/api/v1/incidents`                    | Create incident (INCIDENT record)                     |
| PATCH  | `/api/v1/incidents/{id}/primary-claim` | Set primary claim org (originator, 30-day window)     |
| PATCH  | `/api/v1/incidents/{id}/claim`         | Set the organization claim, default `CIRCA`           |
| GET    | `/api/v1/incidents/{id}/designations`  | Get org designations                                  |
| GET    | `/api/v1/incidents/{id}/filings`       | Paginated filings with assessment counts              |
| GET    | `/api/v1/incidents/{id}/playlists`     | Curated playlists; the incident author's pinned first |
| POST   | `/api/v1/incidents/{id}/playlists`     | Create a playlist                                     |

### 4.4 Organizations

| Method | Endpoint                     | Description                                    |
| ------ | ---------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/orgs`               | List orgs (filter by recognition state, type)  |
| GET    | `/api/v1/orgs/{id}`          | Get org page and dossier                       |
| POST   | `/api/v1/orgs`               | Create an organization, initially unrecognized |
| PATCH  | `/api/v1/orgs/{id}`          | Update org page (moderators only)              |
| POST   | `/api/v1/orgs/{id}/vote`     | Vote on recognition                            |
| GET    | `/api/v1/orgs/{id}/dossier`  | Get dossier                                    |
| PATCH  | `/api/v1/orgs/{id}/dossier`  | Edit dossier (appointed moderators)            |
| GET    | `/api/v1/orgs/{id}/mentions` | Get records and incidents referencing the org  |
| GET    | `/api/v1/orgs/{id}/adopters` | List users with the org flair                  |

### 4.5 Characters

| Method | Endpoint                         | Description                                             |
| ------ | -------------------------------- | ------------------------------------------------------- |
| GET    | `/api/v1/characters`             | List characters (filter by usage policy, author)        |
| GET    | `/api/v1/characters/{id}`        | Get character page                                      |
| POST   | `/api/v1/characters`             | Create character; default `restricted`                  |
| PATCH  | `/api/v1/characters/{id}`        | Update character (creator only)                         |
| POST   | `/api/v1/characters/{id}/import` | Import into a draft; records restricted acknowledgement |
| GET    | `/api/v1/characters/{id}/refs`   | Records referencing the character                       |

### 4.6 Recoveries (Items)

| Method | Endpoint                       | Description                                           |
| ------ | ------------------------------ | ----------------------------------------------------- |
| GET    | `/api/v1/recoveries`           | List recoveries (filter by category, custody, status) |
| GET    | `/api/v1/recoveries/{id}`      | Get recovery page                                     |
| POST   | `/api/v1/recoveries`           | Register a recovery                                   |
| PATCH  | `/api/v1/recoveries/{id}`      | Update documentation and custody fields               |
| GET    | `/api/v1/recoveries/{id}/refs` | Records referencing the recovery                      |

### 4.7 Drafts and references

| Method | Endpoint                                  | Description                                              |
| ------ | ----------------------------------------- | -------------------------------------------------------- |
| POST   | `/api/v1/drafts`                          | Create a draft                                           |
| GET    | `/api/v1/drafts/{id}`                     | Read a draft                                             |
| PATCH  | `/api/v1/drafts/{id}`                     | Autosave draft body and metadata                         |
| POST   | `/api/v1/drafts/{id}/entities`            | Mint a temporary entity (`TEMP-[TYPE]-[NUMBER]`)         |
| DELETE | `/api/v1/drafts/{id}/entities/{tempCode}` | Remove a temporary entity                                |
| POST   | `/api/v1/drafts/{id}/imports`             | Import characters for this draft only                    |
| POST   | `/api/v1/drafts/{id}/validate`            | Resolve links and report missing or forbidden references |
| DELETE | `/api/v1/drafts/{id}`                     | Discard the draft and its temporary entities             |
| GET    | `/api/v1/references/{code}`               | Resolve a typed code to its entity summary               |

### 4.8 Emails

| Method | Endpoint                   | Description                          |
| ------ | -------------------------- | ------------------------------------ |
| GET    | `/api/v1/emails`           | List emails (filter by type, folder) |
| GET    | `/api/v1/emails/{id}`      | Get email                            |
| POST   | `/api/v1/emails/{id}/file` | File email into case folder          |
| PATCH  | `/api/v1/emails/{id}/read` | Mark read                            |

### 4.9 Moderation

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | `/api/v1/moderation/log`            | Public moderation log (anonymized) |
| POST   | `/api/v1/moderation/tombstone`      | Tombstone record (moderator only)  |
| POST   | `/api/v1/moderation/appeals`        | Submit a moderation appeal         |
| GET    | `/api/v1/moderation/appeals/{id}`   | Appeal status                      |
| GET    | `/api/v1/moderation/expunged/count` | Count of expunged records          |

### 4.10 Search

| Method | Endpoint         | Description                                                              |
| ------ | ---------------- | ------------------------------------------------------------------------ |
| GET    | `/api/v1/search` | Full-text search across incidents, records, orgs, characters, recoveries |

Implemented in the Archive Application/Infrastructure projects. Inputs are `q`,
`holder`, repeated `type`, `class`, `status`, `lifecycle`, `access`, `advisory`,
`warn`, `disclosure`, `warnTag`, `excludeWarnTag`, plus `period`, `from`, `to`,
`language`, `sort`, `page`, and `limit`. Repeated facet values combine with OR;
different facets combine with AND. Exclusions override included warning tags.
`language=en|ko` defaults to English; `lang` is an accepted alias. English uses
FTS and trigram fallback; Korean uses trigram matching. Holder is a literal
case-insensitive printed-code prefix, with no relationship lookup.

Responses contain `items`, `page` (number, size, total, totalPages), common-filtered
`facets`, normalized `applied` filters, and `meta` (codeMatch, holderMatch, language).
Items distinguish entity `type` from filing `class`, expose lifecycle/access/advisory
separately from display status, and include plain-text excerpts with UTF-16 highlight
offsets. Warning tier/disclosure can be null for dossiers. Rumours have null `code`,
`displayCode=RUM`, a reference number, and an incident parent. Organization codes
stay canonical while display codes preserve stored legacy aliases.

Public discovery excludes restricted, erased, and tombstoned rows before counts,
along with records whose incident parent is hidden. Sealed incidents always return
title-visible metadata stubs. Sealed records return stubs unless the viewer has a
live session and an approved, dated access request. Ownership and moderation roles
grant no bypass. Bodies in stubs cannot affect matching, ranking, or excerpts.
Display status precedence is sealed over contested over on-file within this visible
set; contested requires at least 10 assessments and at least 70% contest votes.

The endpoint is anonymous and treats invalid/revoked sessions as guests. Every
response uses `Cache-Control: private, no-store` and `Vary: Cookie`. Pagination
uses Link headers and pages 1–100 with sizes 10/20/50. Requests are limited to
4 KiB, 200 query characters, 120 holder characters, and 20 values per facet.
Invalid input returns 400 `invalid_search_filter`; process-local IP limiting
(default 60/minute, `Search:PermitLimit`) returns 429 `rate_limit_exceeded` with
Retry-After. A 3-second SQL timeout returns 503 `search_unavailable`.

See [search implementation and verification](backend/src/Modules/Archive/Circa.Archive.Infrastructure/Search/README.md)
and the [additive schema upgrade](backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/README.md).
The client remains fixture-backed until destination pages are integrated.

### 4.11 Real-time (SignalR)

| Hub           | Events                                              |
| ------------- | --------------------------------------------------- |
| `EmailHub`    | `NewEmail`, `EmailFiled`                            |
| `VoteHub`     | `AssessmentCountUpdated`                            |
| `AdoptionHub` | `RecordAdopted`, `OrganizationRecognized`           |
| `EntityHub`   | `TemporaryEntityPromoted`, `CharacterOwnerNotified` |

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

| Icon | Name          | Type   | Description                                             |
| ---- | ------------- | ------ | ------------------------------------------------------- |
| 📧   | Inbox         | App    | Email client. Hub for discovery.                        |
| 📁   | Archive       | Folder | Every case ever filed.                                  |
| 📁   | Organizations | Folder | Org dossiers and registry pages.                        |
| 👤   | Characters    | Folder | Character registry and usage policies.                  |
| 📦   | Recoveries    | Folder | Item registry (`ITM`) and custody records.              |
| 📝   | My Records    | App    | Dashboard of user's written records and drafts.         |
| 🔍   | Search        | App    | Global search.                                          |
| 📄   | WRITE.exe     | App    | Record editor. Creates new records.                     |
| 🗑️   | Recycle Bin   | Folder | User's deleted drafts and records. Recoverable 30 days. |
| 📁   | _EXPUNGED     | Folder | Always empty. Shows count of tombstoned records.        |
| ⚙️   | System        | Folder | CIRCA/OS lore files, help, corrupted files.             |

### 5.3 Case Folder Structure

When a user opens a case folder, they see:

```
📁 INC-008928
   The Black Dog
   ├── 📄 CASE_BRIEF.pdf
   ├── 📄 INC-008928.pdf
   ├── 📁 Explorations
   │   ├── 📄 EXP-288902.pdf
   │   └── 📄 EXP-288903.pdf
   ├── 📁 Evidence
   │   ├── 📄 EVI-035783.pdf
   │   └── 📧 EVI-035784.eml
   ├── 📁 Rumours
   │   ├── 📝 RUM-001.txt
   │   └── 📝 RUM-002.txt
   ├── 📁 Recoveries
   │   └── 📦 ITM-000143.pdf
   ├── 🖼️ EVIDENCE_01.jpg
   ├── 🖼️ EVIDENCE_02.png
   └── 📄 FORK_TREE.pdf
```

**Rules:**

- Case folder name is the Incident display code. Subtitle is the designation.
- Organization holder codes are cosmetic aliases and never replace the archive code in a filename.
- Maximum two levels of nesting inside a case.
- Evidence images attached to an Evidence record sit with that record; loose evidence sits flat.
- Forks live beside their source with `_F1`, `_F2` suffixes.
- `FORK_TREE.pdf` renders the branch diagram.

### 5.4 File Types and Icons

| Icon | Extension       | What it is                               | Storage                           |
| ---- | --------------- | ---------------------------------------- | --------------------------------- |
| 📄   | `.pdf`          | Record (incident, exploration, evidence) | Markdown in DB, rendered as paper |
| 📧   | `.eml`          | Email filed into a case                  | Markdown in DB                    |
| 📝   | `.txt`          | Rumour, loose note, scrap                | Markdown in DB                    |
| 📦   | `.pdf`          | Recovery registry page (`ITM`)           | Markdown in DB, rendered as paper |
| 👤   | `.pdf`          | Character registry page (`CHR`)          | Markdown in DB, rendered as paper |
| 🖼️   | `.jpg` / `.png` | Evidence photo                           | S3                                |
| 🎵   | `.wav`          | Audio evidence                           | S3                                |
| 📁   | —               | Folder                                   | DB row                            |

### 5.5 Email Client

The email client is a desktop app. It has four folders:

| Folder           | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| **Inbox**        | Unread and recent emails. Default view.                                  |
| **Filed**        | Emails filed into cases. Auto-archived.                                  |
| **Digests**      | Moderation reports, system notices.                                      |
| **Dead Letters** | Emails from accounts that no longer exist. Anomalous emails appear here. |

**Filing emails:** Drag an email to a case folder, or right-click → "File to case...". Once filed, it appears in the case folder as `.eml` and is removed from Inbox.

### 5.6 WRITE.exe (Record Editor)

- Off-brand MS Word icon. Tooltip: "Document editor."
- Opens a Markdown editor styled as a 90s word processor.
- User chooses:
  - Case (searchable dropdown, or create a temporary incident)
  - Organization affiliation (searchable dropdown, or create a temporary organization)
  - Type (INCIDENT, EXPLORATION, EVIDENCE, RUMOUR)
  - Continuation (`Follows`)
  - Access policy and content warnings
- The Entity Registry sidepanel can mint `TEMP-EVI-01`, `TEMP-CHR-01`, `TEMP-ORG-01`, and `TEMP-ITM-01` entities tied to the draft id. Images added there become temporary evidence until submission.
- Importing a character records a per-draft usage request. A restricted character opens the acknowledgement dialog described in 3.3.
- `[[` completion inserts a typed wikilink. Unresolved tokens block submission rather than producing broken references.
- Submission promotes temporary entities, replaces temporary tokens with permanent codes, allocates the display code, computes the holder code and content hash, and files the record. Failure leaves the draft intact.
- Saves as a `.pdf` representation in the correct case folder.
- Content hash computed on save for tombstone matching.

### 5.7 My Records App

- List view (default): sortable, filterable list of user's records.
- Card view: grid of recent records with case, organization, and assessment count.
- Filters: drafts, on file, adopted, forked, tombstoned, disputes, rumours.
- Shows pending access requests for sealed filings and character-owner notifications.
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
- One window per destination id: reopening focuses and never duplicates. The reader is one window whose trail cursor moves, not one window per record.
- A desktop URL names the focused visible document: `/desktop` with nothing focused, `/desktop/{destination}` for a shortcut, and `/desktop/record/{code}` for the reader. Opening a document pushes history; focusing, minimizing, closing, and moving the reader's cursor replace it; a deep link, Back, and Forward write nothing and only adopt the address.
- Only the workspace's URL adapter reads or writes the pathname. The shell and its tests stay router-free.
- A refresh restores the open windows from per-tab `sessionStorage` and leaves the URL's window focused. Windows do not survive leaving the workstation for the public site, because the workspace layout unmounts.
- `/desktop` unknown destinations and unknown record codes are 404s, matching the public record route. Every desktop route is `noindex, nofollow`; the public edition remains canonical.

### 5.11 Localization

The interface ships in English and Korean. This is implemented, in `client/src/i18n/`, and the shape is deliberate:

- **Routing.** Every page lives under a language segment — `/{lang}`, `/{lang}/site`, `/{lang}/meta`, and the workstation's `/{lang}/desktop`, `/{lang}/desktop/{destination}`, and `/{lang}/desktop/record/{code}` — with `localePrefix: "always"`, so one document answers at exactly one address. A bare path is redirected by `client/src/proxy.ts` (Next.js 16's rename of `middleware.ts`). The workstation's URLs are built from the locale-less pathname through next-intl, so a link or history write keeps the reader's language.
- **Detection.** Resolution order is an explicit path prefix, then the `NEXT_LOCALE` cookie, then the browser's `Accept-Language` weighting, then English. There is no geolocation: IP country describes a connection, not a reader, and would misroute Korean speakers abroad and English speakers in Korea.
- **Override.** A visible language switcher on the portal's utility bar and in the workstation tray writes the cookie, and each option links to the current page in the other language rather than to the site root.
- **Messages.** One catalog file per namespace per language under `client/messages/<locale>/`, loaded by `client/src/i18n/request.ts`. The `landing` namespace is rendered on the server and is the only one held back from the client bundle.

**The chrome/content boundary.** Interface chrome is translated; filed content is not. Menus, labels, status lines, notices, and empty states localize. The archive index, the incident titles, the record corpus, the mail fixture, and the file tree are the fiction's filed documents and stay as filed in both languages — an archive does not translate a document that was filed in English, and the fiction makes the same point in its own words when it describes an organization by "a short sample record in the organization's own language". Brand names (`CIRCA`, `Titan Browser`, `CIRCA Explorer`, `CIRCA Word`, `CIRCA Reader`) and identifiers (archive codes, document numbers, dates, version strings) are proper nouns or citations and are never translated.

**Consequences to carry forward.** Classification and status words are interface vocabulary rather than record metadata, so the archive's internal search has to match the words a reader can see; that fix is implemented. A Korean webfont is not bundled, so Hangul falls back to the reader's own Korean face, and the uppercase and letter-spacing conventions in section 5 are Latin conventions that still need a Korean decision — both remain open interface decisions.

---

## 6. Record Lifecycle

### 6.1 Types

| Type            | Code                | Description                                                                                                            | Length                          |
| --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **INCIDENT**    | `INC-{NNNNNN}`      | Original ghost story. Establishes theme and may hint at foundational constraints; narrator knowledge remains distinct. | 15,000 characters / 2,500 words |
| **EXPLORATION** | `EXP-{NNNNNN}`      | A character or group deliberately enters an Incident to learn its nature and rules.                                    | 25,000 characters / 5,000 words |
| **EVIDENCE**    | `EVI-{NNNNNN}`      | Witness statement, interview, document, image, or other account; usually hearsay that adds contradiction or support.   | 10,000 characters / 2,000 words |
| **RUMOUR**      | none (separate tab) | Speculation without narrative basis, filed to misdirect. Displayed in the Rumours tab.                                 | 10,000 characters / 1,000 words |

`DISCOVERY` is retired as a record type. The former first-contact role is now an Evidence or Exploration filing depending on who wrote it and whether an expedition occurred. Existing fixture content still uses the old label and must be migrated when the corpus is replaced. Rumours have no inherent code, but the schema still consumes a sequence number; the link format for rumours remains unresolved (see 13).

### 6.2 Creation Flow

1. User opens `WRITE.exe` and creates a draft.
2. Chooses or creates the Incident (`INC`) and the author's organization affiliation (default `CIRCA`).
3. Chooses the record type and optional `Follows` continuation.
4. Writes Markdown, inserting typed `[[...]]` references and importing characters from the Entity Registry.
5. Optionally mints temporary entities (`TEMP-EVI-01`, `TEMP-CHR-01`, `TEMP-ORG-01`, `TEMP-ITM-01`) tied to the draft.
6. Sets access policy and content warnings.
7. Submits. The server validates every reference and import, promotes temporary entities, allocates permanent codes, rewrites tokens, computes the content hash, and writes revision 1 in one transaction.
8. If any step fails, nothing is promoted and the draft remains editable.
9. Imported character owners are notified asynchronously.
10. The record appears in the Incident's filings and in the author's dashboard.

### 6.3 Filing Status

- **on_file** — normal, visible.
- **erased** — the record is deleted from rendering; its number remains permanently occupied.
- **draft** — editing only; never public.
- **tombstoned** — moderation removal from discoverability, distinct from erasure.

The authoring framework separates publication, evidentiary support, and continuity adoption. A published record can be corroborated but independent, or disputed yet adopted. Revision and retraction behavior is described in 6.9; the regulations require that material revisions not silently erase prior public contributions.

### 6.3.1 Reviewer assessment

- Each account may `Corroborate` or `Contest` a record once and may remove its assessment.
- Assessments are advisory. They affect ordering and visibility, never factual status or adoption.
- A record receives the `Disputed` advisory only after at least 10 total assessments with 70% or more `Contest`.
- The advisory text must state that the assessment does not determine the factual status of the documented events.
- Coordinated manipulation and retaliatory voting are prohibited and may be moderated.

### 6.4 Adoption

- Filing does not automatically change an Incident's principal continuity.
- The Founding Author or an authorized Continuity Steward curates adoption into that sequence. Foundational amendment authority requires explicit delegation beyond ordinary stewardship.
- Community assessments and comments inform adoption and credibility; they do not automatically make either binding.
- Core Rules protect an Incident's identity. Evidence-supported observations and unverified claims remain challengeable within those boundaries.
- Versioned, authorized amendments preserve the effective constraints for earlier records.
- Character use follows declared permissions, with `restricted` as the default and per-draft imports rather than blanket reuse.
- Organization continuities remain a separate scope; no organizational account or owner role is introduced.
- The original author retains credit, and non-adoption does not remove a compliant independent filing.
- Stewardship, succession, and orphaned-Incident handling are intended workflows, not implemented permissions. See the [Author guide](docs/AUTHOR_GUIDE.md).

### 6.5 Forking and Branches

- A record fork receives its own `circa_code` and preserves parent lineage through `parent_record_id` in the draft model.
- Independent publication does not automatically create a divergent continuity.
- A branch explicitly identifies its source sequence, divergence point, and record lineage. The current schema does not fully model that relationship.
- Branches preserve foundational constraints and character permissions; they do not grant unrestricted amendment rights.
- Conflicting outcomes may remain filed independently and be adopted separately. No one branch overwrites every other sequence.

### 6.6 Tombstoning

- Triggered by meta violation report.
- Record removed from discoverability.
- Only author can view it (via My Records → Tombstoned).
- Author notified with specific rule violated.
- Content hash stored to prevent reposting.
- Public moderation log updated (anonymized).
- Strike count incremented on user.
- The author may appeal through the moderation process except where legal, safety, or abuse-prevention constraints require otherwise.

### 6.7 Entity references and wikilinks

Authors write typed references as `[[TYPE-NUMBER]]`:

| Prefix | Target             | Example          |
| ------ | ------------------ | ---------------- |
| `INC`  | Incident           | `[[INC-008928]]` |
| `EXP`  | Exploration record | `[[EXP-288902]]` |
| `EVI`  | Evidence record    | `[[EVI-035783]]` |
| `RUM`  | Rumour             | unresolved       |
| `ORG`  | Organization       | `[[ORG-005429]]` |
| `CHR`  | Character          | `[[CHR-018257]]` |
| `ITM`  | Recovery           | `[[ITM-000143]]` |

- Incidents, explorations, evidence, rumours, organizations, and recoveries may be referenced regardless of recognition or filing status, subject to access policy.
- Characters are different: the author must import the character from the Entity Registry for that draft. Importing does not license future drafts.
- A reference to a restricted or invisible record must not leak its existence or content; the resolver returns the same missing-reference error used for reserved codes.
- References are navigation, not ownership or canon. Linking an entity does not grant control over it.
- The authoritative check happens at submission; the editor's preview is advisory.

### 6.8 Temporary entities and atomic submission

- The Entity Registry can mint barebones Organizations, Characters, Recoveries, and Evidence with only a name; `TEMP-[TYPE]-[NUMBER]` is scoped to the draft id.
- Images added in the editor become temporary evidence links tied to the draft.
- Submission validates content, links, and permissions before creating permanent entities.
- Temporary entities are promoted, tokens are rewritten, and the record is written in one transaction. A partial failure fails the entire submission.
- Discarding a draft discards its temporary entities and imports. No orphaned permanent entities may remain from failed submissions.

### 6.9 Revisions, retractions, and redactions

- Every substantive edit creates a `RecordRevisions` row; revision history is preserved and public where the record is public.
- Authors may revise or retract their own filings through available functionality. Material revisions must not silently erase the historical existence of a contribution that has become part of a collaborative narrative.
- Narrative redaction uses the archive's `||text||` syntax. Redaction must not be used to conceal policy violations or evade moderation.
- Erasure consumes the display number permanently and removes the record from rendering.
- Withdrawal after other authors have built on a record remains an unresolved workflow.

### 6.10 Access policy and content warnings

- **public:** rendered normally to any reader.
- **sealed:** the first fetch returns a notice instead of the body; the reader may request explicit access, which is recorded and decided by an authorized party.
- **restricted:** the platform returns `401` with the diegetic notice `LEVEL 7 or above clearance required`. This is a platform decision, not a fictional classification.
- Warnings follow AO3-style tiers: `Red` (explicit graphic death, gore, violence), `Yellow` (some mature content), `Green` (none of those). Specific tags such as `Graphic Violence`, `Psychological Horror`, `Sexual Violence`, `Self-Harm`, and `Major Character Death` accompany the tier.
- `None` (author chose not to include warnings), `No Warnings Apply` (author confirms warnings are not applicable), and `Warnings Not Provided` are distinct states and must not be collapsed in the UI or data model.
- Classification (`LEVEL 3`–`LEVEL 6`) is a cosmetic clearance rank printed on the sheet; it is not an authorization control.

### 6.11 Playlists

- Any author may create a playlist of filings for an Incident as their preferred reading order, without establishing canon.
- Several playlists may coexist. The Incident author's playlist is pinned first, but not privileged as truth.
- Playlist membership does not change adoption, evidence, or visibility.

---

## 7. Organization Lifecycle

### 7.1 States

| State            | Directory | Can adopt | Notes                                                              |
| ---------------- | --------- | --------- | ------------------------------------------------------------------ |
| **Unrecognized** | Yes       | Yes       | Default on creation. Users may adopt the tag; not mainstream.      |
| **Recognized**   | Yes       | Yes       | Community vote confirms the organization's place in the directory. |
| **Erased**       | No        | No        | Registry status retired. The identifier is permanently occupied.   |

This state model supersedes the earlier tag → eligible → promoted → rejected → reinstated ladder. Recognition is not endorsement, ownership, or platform authority. Erasure is a registry action; it does not grant the platform ownership of an author's text.

### 7.2 Code Structure

- **Reference ID:** immutable `ORG-{minimum six digits}`, different from the UUIDv7 key.
- **Reserved range:** `0-5428` is reserved; new organizations begin at `5429`.
- **Legacy identifiers:** `ORG-{Letter}-{Number}` and `CIRCA-R-{Number}` are retained only where they already exist. New organizations do not receive carnage letters or erased codes.
- **Holder codes:** an organization may configure `{PREFIX}{NUMBER}{SUFFIX}` and severity vocabulary for records it holds. These are cosmetic aliases; the archive reference remains canonical.
- **Mapping:** the old carnage-letter scheme is distinct from the [Incident classification scale](docs/lore/Classifications.md). Do not recalculate organization identifiers from Incident assessments.

### 7.3 Organization page

The page carries established year, recognized year, recognition state, filed date, filing author, moderators, geographical influence, personnel count, logo, gallery, type (`government`, `private`, `religious`), and up to 10,000 words of Markdown. It lists records that declare affiliation with the organization and records that reference it.

### 7.4 Moderation

- Appointed authors may update the organization page and dossier.
- Organization moderators do not receive platform moderation powers.
- No organizational account or owner role is introduced.
- Organization continuities are a separate scope from user adoption.

### 7.5 Recognition vote

- Community vote is advisory and determines directory standing.
- Exact threshold and quorum remain open; the earlier 20-upvote / 60% threshold may be retained but is not a decision of the 2026-10-21 notes.
- Recognition does not establish the organization's claims as true.

### 7.6 Erased organizations

- Erased organizations cannot adopt, recognize, or hold continuities.
- Their code remains occupied.
- Records written by or about them remain unless separately moderated.
- References resolve according to record visibility; erasure must not expose hidden text.

### 7.7 Near-identical detection

- Fuzzy-match on creation and temporary-entity promotion.
- Detection does not block; it offers `Same organization`, `Variant`, or `New`.
- `Variant` requires an explicit relationship to the source organization and must not silently fork an existing identifier.

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

- Multiple continuities per org may be displayed as `ORG-005429/C1`, `C2`; legacy `ORG-A-081323/C1` identifiers remain valid.
- Incidents also have principal and divergent continuities under the authoring framework. Their identifiers, storage, and authorization remain to be designed.
- A single independent record is not automatically a branch.
- Readers can follow their preferred continuity; that choice does not override character permissions or foundational constraints.
- Continuity-specific adoption is separate from publication and evidentiary status.

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
- Author notified with the specific rule violated.
- Content hash stored.
- Strike count on dashboard.
- Public moderation log (anonymized).
- Appeals are available through the established review process, except where legal, safety, or abuse-prevention constraints require otherwise.

### 9.3 Assessment vs Reporting

- **Assessment:** `Corroborate` / `Contest`, one per account, removable. Used for sort order, discovery, and an advisory `Disputed` notice; never establishes truth.
- **Reporting:** Triggers moderation review.

### 9.4 Moderator Roles

- **Platform staff:** Meta violations, policy, appeals.
- **Community volunteers:** May be added later for first-pass review.
- **Organization moderators:** Maintain organization pages and dossiers only.
- Community never deletes. Staff never assesses as a moderation tool. In-world authority grants no administrative power.

### 9.5 Platform regulations

The public regulations define the content and conduct baseline:

- No filing is authoritative solely because of authorship, community assessment, or curated inclusion.
- Contributions must respect an Incident's premise, foundational constraints, and narrative identity without being required to resolve its mysteries.
- Characters and organizations must not possess unrestricted narrative authority; established consequences and character ownership are preserved.
- Cross-Incident changes that significantly alter another author's premise require consent.
- Filings must make a meaningful contribution. Humor and satire are permitted; targeted ridicule and spam are not.
- Material revisions must not silently erase prior public contributions. Redaction must not conceal violations.
- Originality and third-party IP rules apply. Published original content is offered under **CC BY-NC-SA 4.0**; authors retain copyright.
- Harassment, doxxing, coordinated suppression, and manipulation of assessments are prohibited.
- Fictional authority is separate from platform administration. Enforcement considers nature, severity, intent, and frequency, and provides an appeal path where constraints permit.

The full public regulations should be published alongside the [Author guide](docs/AUTHOR_GUIDE.md); the current pre-release guide remains the contributor-facing summary.

---

## 10. Search and Discovery

### 10.1 Email Client as Hub

- Inbox: recent, popular, system alerts, case assignments.
- Dead Letters: anomalous emails.
- Digests: moderation reports.

### 10.2 Global Search

- Full-text search across incidents, records, organizations, characters, and recoveries.
- Implemented filters: cosmetic holder code, entity type, filing class, display status,
  exact lifecycle/access/advisory, warning tier/disclosure/included and excluded tags,
  filing date bounds/period, language, sorting, and pagination.
- Deferred: resolved organization/author/tag/character/custody filters, broader mentions,
  classification UI, cursors, saved searches, and search-as-you-type. Holder does not
  resolve affiliations, claims, or custody; a future mentions model owns that behavior.
- The API returns all five entity types. The current UI enables incident, record, and
  organization and keeps fixture transport until those destinations use real data.
- Search must match display vocabulary (for example `Corroborate`, `On file`, `Restricted`) rather than internal enum names.
- Reference lookup accepts typed codes and resolves them through the same visibility rules as record reading.

### 10.3 Incident pages and discovery

- `/records/[incident]/filings?paginated` lists filings with corroborate and contest counts.
- `/records/[incident]/playlists` lists curated playlists, with the Incident author's pinned first.
- Random old record button, curated collections, citation graph, and algorithmic feeds remain planned.

---

## 11. Security and Auth

- JWT-based auth; current implementation uses rotating HttpOnly cookie sessions (see the implementation note at the end of this document).
- Roles: guest, author, moderator. Organization moderators and character owners are resource-level relationships, not roles.
- Rate limiting on assessments, reports, submissions, access requests, and character imports.
- Content hashing for tombstone matching.
- S3 signed URLs for evidence.
- Uploaded images are validated and stripped of metadata; temporary evidence is scoped to a draft and removed with it.
- Character imports record consent and notification timestamps; restricted characters require explicit acknowledgement before submission.
- Authorization checks cover sealed/restricted reads, author-only revisions, organization-moderator edits, and character ownership. Reference resolution must not leak hidden records.
- Published original content is offered under CC BY-NC-SA 4.0; third-party material requires permission and may be removed.

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

1. **Rumour links.** Rumours have no inherent code, yet the wikilink table lists `RUM`. What stable token should `[[RUM-...]]` use?
2. **First live Incident code.** Reserved `0-07539` implies the first live code is `INC-07540`, but the public archive index begins at `INC-07539`. Which is correct?
3. **Recovery and character ranges.** The notes reserve Organization and Character ranges but not `ITM`. Confirm the starting Item number and whether `0` is reserved.
4. **Character scope.** Does `Restricted` permit only reference, or also consented characterization? Should `Reference Only` return as a third policy?
5. **Recognition threshold.** What vote count, quorum, and review period recognize an organization, and can recognition be revoked?
6. **Sealed access.** Who decides a sealed-access request: the filing author, the Incident author, an organization moderator, or platform staff?
7. **Withdrawal and deletion.** Can an author permanently erase their own record, and what happens to dependent references and playlists?
8. **Revision visibility.** Are prior revisions public for every record, or only for adopted or contested filings?
9. **Rule proposals.** Should foundational amendments be modeled in a `RuleProposal` table instead of a free-text revision reason?
10. **Primary-claim notification.** Does the claim holder get notified when a new organization files on their Incident? _Leaning yes._
11. **Moderation record format.** The public moderation note format is not finalized.
12. **First seeded content.** First organizations, first Incident, and the initial playlists are not written.
13. **Taskbar behavior.** Single-window or multi-window? _Leaning multi-window._
14. **Holder-code syntax.** The notes describe `{PREFIX}{NUMBER}{SUFFIX}` with `[SEVERITY]` as a component; the exact grammar and collision rules remain undefined.

---

## 14. Appendices

### 14.1 ID Formats

| Entity              | Format                     | Example         | Reserved range |
| ------------------- | -------------------------- | --------------- | -------------- |
| Incident            | `INC-{minimum six digits}` | `INC-008928`    | `0-07539`      |
| Exploration         | `EXP-{minimum six digits}` | `EXP-288902`    | `0-288901`     |
| Evidence            | `EVI-{minimum six digits}` | `EVI-035783`    | `0-35782`      |
| Rumour              | no inherent code           | —               | —              |
| Organization        | `ORG-{minimum six digits}` | `ORG-005429`    | `0-5428`       |
| Character           | `CHR-{minimum six digits}` | `CHR-018257`    | `0-18256`      |
| Recovery            | `ITM-{minimum six digits}` | `ITM-000143`    | open           |
| Temporary entity    | `TEMP-{TYPE}-{NN}`         | `TEMP-CHR-01`   | per draft      |
| Legacy organization | `ORG-{Letter}-{Number}`    | `ORG-A-081323`  | legacy only    |
| Legacy erased org   | `CIRCA-R-{Number}`         | `CIRCA-R-1000`  | legacy only    |
| Holder code         | `{PREFIX}{NUMBER}{SUFFIX}` | `CIRCA-A-08928` | cosmetic       |

Display numbers use a minimum width of six digits. Values above six digits remain numeric; the width is a formatting floor, not a cap. The UUIDv7 key is the database identity in every case.

### 14.2 File Extensions

| Extension       | Meaning                             |
| --------------- | ----------------------------------- |
| `.pdf`          | Record (Markdown rendered as paper) |
| `.eml`          | Filed email                         |
| `.txt`          | Rumor, note, scrap                  |
| `.jpg` / `.png` | Evidence photo                      |
| `.wav`          | Audio evidence                      |

### 14.3 Desktop Icon List

- 📧 Inbox
- 📁 Archive
- 📁 Organizations
- 👤 Characters
- 📦 Recoveries
- 📝 My Records
- 🔍 Search
- 📄 WRITE.exe
- 🗑️ Recycle Bin
- 📁 _EXPUNGED
- ⚙️ System

---

_This document is a living specification. All decisions are subject to revision as the project evolves._

### Implemented authentication transport (phases 5–6)

Auth routes are under `/api/v1/auth`. Login/register return a user summary and set HttpOnly cookies; no response body contains tokens. Access JWTs last 600 seconds with zero validation clock skew (`SameSite=Lax; Path=/`). Refresh cookies use `SameSite=Strict; Path=/` so page requests reach the Next.js refresh proxy; the server session still expires seven days after sign-in. Production requires Secure cookies. `/me` checks the live session; session deletion checks ownership. Logout revokes the session and clears both cookies.

Unsafe browser requests require an exact allowed Origin when supplied. Limits are 5 login attempts/minute per IP+normalized identifier, 3 registrations/hour per IP, and 30 refreshes/minute per session across rotations. Limits are process-local. Rejections return ProblemDetails with stable codes, including `invalid_credentials`, `locked`, `session_expired`, `refresh_reuse`, and `rate_limit_exceeded`. Auth audit events exclude credentials.

Next's locale proxy refreshes missing/near-expiry access cookies, forwards Set-Cookie, and passes fresh cookies into the current render. Browser API calls use same-origin credentials and single-flight refresh with one retry. Server account helpers forward cookies without caching. `API_ORIGIN` is server-only; development rewrites `/api`, while production requires the shared reverse proxy to route API traffic. Localized sign-up, sign-in, and account pages use this transport at `/{lang}/sign-up`, `/{lang}/sign-in`, and `/{lang}/account`. The account page shows username and role and signs out the current session. Portal/archive access links resolve the real session on the server, using per-request memoization and no shared personalized cache. Public pages remain readable during outages; account views provide a retryable unavailable state. Archive data integration remains separate work.

### Phase-one search warning exclusions

The fixture search UI accepts repeated `excludeWarnTag` canonical warning slugs alongside
`warnTag`. Included tags match with OR; any excluded tag removes a match.
Exclusion wins when a tag appears in both lists. The parser, links, active-filter
chips and API request serializer preserve this distinction. The future search
endpoint must implement the same predicate before switching to API transport.
