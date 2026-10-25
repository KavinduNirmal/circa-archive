# Circa.Modules.Archive.Tests

## Responsibility

Integration tests for archive persistence and search indexes against disposable
PostgreSQL 16 containers.

## Structure

- `ArchivePostgresFixture.cs`: starts PostgreSQL and applies `CreateArchiveSchema.sql`.
- `ArchiveSchemaTests.cs`: verifies `pg_trgm`, exact/composite/partial/GIN indexes,
  unique display codes, rumour reference consumption, and trigram index use.
- `ArchiveModelTests.cs`: verifies all modeled entities persist and archive
  vocabulary is stored in the documented database form.

## Boundaries

These tests exercise schema and EF mappings only. They do not test HTTP routes or
CRUD because the archive module has no endpoints or write workflows yet.
