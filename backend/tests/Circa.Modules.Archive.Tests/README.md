# Circa.Modules.Archive.Tests

## Responsibility

Unit and integration tests for archive search contracts, persistence, and indexes.
Database tests use disposable PostgreSQL 16 containers.

## Structure

- `SearchRequestTests.cs`: database-free search validation, defaults, canonical
  facets, language alias, exclusions, and invalid input tests.
- `ArchivePostgresFixture.cs`: starts PostgreSQL and applies `CreateArchiveSchema.sql`.
- `ArchiveSchemaTests.cs`: verifies `pg_trgm`, exact/composite/partial/GIN indexes,
  unique display codes, rumour reference consumption, and trigram index use.
- `ArchiveModelTests.cs`: verifies all modeled entities persist and archive
  vocabulary is stored in the documented database form.

## Boundaries

These tests exercise application contracts, the SQL search reader, schema, and EF
mappings. HTTP search behavior belongs to `Circa.Api.IntegrationTests`; archive
CRUD remains unimplemented.

## Global search

`SearchSchemaTests` checks idempotent search dependencies and generated indexes.
`SearchHelperTests`, `SearchVocabularyTests`, and `SearchClientContractTests` check
code ranges, plain-text/UTF-16 helpers, exact translated vocabulary, and every
canonical value exported by the client contract. `SearchReaderTests` seeds five
entity types plus lifecycle/access/advisory cases and verifies filters, sealed
body isolation, explicit approvals, ranking, facets, sorting, and empty-page totals.
Its 10,000-document benchmark records seven query scenarios with a 750 ms p95 ceiling.

```sh
dotnet test backend/tests/Circa.Modules.Archive.Tests --logger 'console;verbosity=detailed'
```

`SearchReaderTests` also covers phase 4 relationship filters, author identity privacy,
exact-holder ranking, and three-page keyset traversal for every sort. Request tests
cover bounded compressed cursors, Korean titles, and rejected nested history.

`ArchiveDestinationTests` verifies incident acknowledgment, restricted/erased
visibility, record approvals (including missing decision dates), tombstones,
and stable rumour destinations against PostgreSQL.

Security regressions execute destructive-looking SQL payloads as bound search data
in every text input and reject control characters before the reader runs. The
PostgreSQL fixture uses Testcontainers 4.16 with the explicit PostgreSQL image
constructor, avoiding the older vulnerable SSH/Docker transitive dependencies.
