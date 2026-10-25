# Circa.Archive.Domain

## Responsibility

Defines the archive entities and vocabulary used by persistence:

- `Incident`: the originating ghost story and its designation/severity.
- `Record`: an `EXP`, `EVI`, or `RUM` filing against an incident.
- `Organization`, `Character`, `Recovery`: registry entities referenced by the
  archive.
- Supporting entities: designations, revisions, assessments, access requests,
  playlists, organization moderators/votes/recognitions/mentions, character
  imports, drafts and temporary entities, entity links, tombstones, moderation
  logs/appeals, emails, and folders.
- `ArchiveEnums.cs`: lifecycle, access, warning, category, custody, usage,
  draft, moderation, email, and folder vocabularies from the development notes.

## Boundaries

The project contains no persistence configuration, HTTP contracts, or business
workflows. Codes are display identifiers; `Id` is the database key. Markdown and
JSON payloads are stored as text until editing and validation workflows define
their typed shapes. Navigation properties describe relationships; `ArchiveDbContext`
still owns table mapping and relationship configuration.

Organizations may preserve a nullable `LegacyCode` display alias alongside the
canonical reference number. It is not a holder or relationship identifier.
