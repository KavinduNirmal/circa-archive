# 009: Versioned SQL migrations for the archive schema

- **Status:** Accepted — implementation pending
- **Date:** 2026-10-26
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

The archive schema is one embedded, idempotent SQL script, `CreateArchiveSchema.sql`, executed at startup when `Database:InitializeOnStartup=true` in Development ([`ArchiveSchemaInitializer.cs`](../../backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/ArchiveSchemaInitializer.cs)). The script creates missing tables, columns, functions, and indexes; it never drops data. An existing local database is upgraded by running the same file with `psql`.

That arrangement carried the pre-release schema through global search, assessments, access requests, and tombstones. It does not scale to the v1 model. [ADR 008](008-v1-public-site-scope.md) adds comments, revisions, playlists, drafts, temporary entities, entity links, and media assets, and changes existing columns. A single file rewritten in place has no ordering, no record of what a given database has already seen, and no safe way to distinguish a fresh database from a partially upgraded one. It also cannot express a baseline: an existing deployment already contains the current tables, so a new migration set must mark that state as applied without replaying it.

The authentication module owns its own schema through EF Core `EnsureCreatedAsync`. The archive module deliberately mirrors hand-written SQL in `ArchiveDbContext`; generated columns, the `recovery_search_text` function, and trigram operator classes are already expressed in SQL because EF cannot map them directly. A migration strategy has to keep the SQL authoritative and the EF model a mirror.

## Decision

The archive schema moves to **versioned, ordered, forward-only SQL migrations**, applied by a small runner in `Circa.Archive.Infrastructure`.

- **Files.** Migrations live in `Persistence/Migrations/` as embedded resources named `NNNN_description.sql`, for example `0001_baseline.sql`, `0002_comments.sql`, `0003_revisions.sql`. `0001_baseline.sql` is the squashed schema that exists today.
- **Ledger.** The runner creates `archive.schema_migrations (version integer primary key, name text not null, checksum text not null, applied_at timestamptz not null default now())`.
- **Apply.** Pending migrations run in ascending version order, each in its own transaction, under a PostgreSQL advisory lock so two API instances cannot race. A migration that fails rolls back and leaves the ledger unchanged.
- **Baseline.** On a database that already has the archive tables but no ledger, `0001_baseline.sql` is recorded as applied without execution. The check is explicit and tested; it must not silently skip a schema that is missing expected objects.
- **Checksums.** The runner stores a SHA-256 checksum per migration and refuses to start when an applied file changed. Correcting an applied migration requires a new file, never an edit.
- **Forward only.** There are no down migrations. Recovery is restore-from-backup or a new forward migration; the existing persistence guide already instructs operators to back up before schema changes.
- **Startup.** Development may still apply migrations automatically when `Database:InitializeOnStartup=true`. Every other environment applies them through an explicit command or deployment step, never implicitly on request traffic.
- **Tests.** A fresh database and a database at the previous version must both reach the same schema. Tests cover rerun-as-no-op, checksum mismatch, failure rollback, and the baseline adoption path.

The first migration set is planned as: baseline, comments, revisions, playlists and items, drafts with temporary entities and entity links, media assets, assessment hardening (`corroborate|contest` check, `updated_at`, aggregate index), and the retirement of `follows_record_id`. The exact split follows the schema workstream; each file must be independently reviewable.

## Consequences

**Positive.** Every database has a recorded, ordered history. Fresh and existing deployments converge through the same mechanism. SQL remains the source of truth for generated columns and functions that EF cannot express. Failed upgrades leave no partial state. The ledger answers "what does this database have?" without reading the schema.

**Negative.** A hand-written runner and migration files are maintenance the team owns. Developers must bump a version rather than editing the script. Checksums make an applied migration immutable, so a mistake costs another migration. Startup auto-apply in Development can hide a migration that production later applies manually; the deployment checklist must exercise the explicit path. The baseline adoption check needs care, because guessing wrong either skips tables or replays a non-idempotent file.

**Follow-ups.** Implement the runner and ledger, convert the current script into `0001_baseline.sql`, and add the v1 migrations with tests. Update [`backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/README.md`](../../backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/README.md) and the root backend guide with the new command. Add the migration check to CI against disposable PostgreSQL. Revisit if the archive adopts a general migration tool.

## Alternatives considered

- **EF Core migrations.** Rejected for the archive. The EF model is a mirror of hand-written SQL; several objects (generated `search_text`/`search_vector` columns, the `recovery_search_text` function, expression indexes and operator classes) are not expressible in the model and would need raw-SQL migration bodies anyway. The auth module already uses `EnsureCreated`, so introducing EF migrations would also require reconciling two schema ownership models. EF becomes attractive only if the archive model stops carrying hand-written SQL.
- **Flyway or DbUp.** Viable, and they provide the ledger and ordering. Rejected for v1 because the backend is a single .NET solution with no other migration dependency, the runner is small, and adding an external tool changes local and container startup. Reconsider if migrations gain branching, undo, or multi-team ownership.
- **Keep one idempotent script and add a version table by hand.** Rejected: it still cannot distinguish a baseline from a partial apply, cannot order destructive changes, and rewrites history in place.
- **Make every migration idempotent and replay all of them on every start.** Rejected: replaying a data migration is not safe, and it hides ordering errors. The ledger makes replay unnecessary.
- **Drop and recreate the archive schema for every environment.** Rejected: production and shared development hold authored content. It also conflicts with the repository's no-destructive-migration rule.

## References

- [ADR 008](008-v1-public-site-scope.md) — the v1 schema this strategy must apply.
- [`ArchiveSchemaInitializer.cs`](../../backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/ArchiveSchemaInitializer.cs) — the current startup script runner.
- [`CreateArchiveSchema.sql`](../../backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/CreateArchiveSchema.sql) — the schema that becomes the baseline.
- [Archive persistence guide](../../backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/README.md) — the current apply and rollback instructions.
- [ARCHITECTURE.md](../../ARCHITECTURE.md) §3.5 and §12 — schema and deployment notes.
