# Archive Persistence

## Responsibility

Defines the `archive` schema and the indexes that support its planned read paths.
`CreateArchiveSchema.sql` is the deployed schema source of truth;
`ArchiveDbContext` mirrors it for application access and tests.

## Index strategy

- **Exact lookups**: unique B-tree indexes cover every display reference number,
  the optional record `code` (partial unique because rumours have no code), and
  `(record_type, reference_number)`. Content hashes are indexed for duplicate
  detection.
- **Fuzzy titles and names**: `pg_trgm` GIN indexes cover incident designations,
  organization names, character names, and recovery names. Large Markdown bodies
  are also indexed through the generated `search_text` columns for Korean search.
- **Full-text bodies**: stored `tsvector` columns generated from Markdown use GIN
  indexes, so long text is searched by full-text operators rather than expensive
  fuzzy scans.
- **Composite feeds**: incident/record/registry directories use composite indexes
  ending in `id` for stable keyset pagination, with `created_at DESC` in the
  expected sort position.
- **Filtered indexes**: common feeds and relationship lookups are partial, e.g.
  `record_status = 'on_file'` for visible records, non-null claim/affiliation
  columns, and `code IS NOT NULL` for coded records.
- **Array and tag filters**: GIN indexes cover `warning_tags`, recovery
  `alternative_names`, and the normalized `record_tags.tag` lookup. The tag index
  is B-tree because tags are an exact controlled vocabulary.

The scaffold creates new empty tables, so the initial index build is
non-concurrent. Future index changes on populated tables should use
`CREATE INDEX CONCURRENTLY` and be deployed separately from table changes.

## Applying the schema

Development startup with `Database:InitializeOnStartup=true` creates `auth` via
`EnsureCreatedAsync`, then executes this idempotent script. For an existing local
database, apply manually:

```sh
psql "$CIRCA_DATABASE_CONNECTION" -v ON_ERROR_STOP=1 --single-transaction \
  -f backend/src/Modules/Archive/Circa.Archive.Infrastructure/Persistence/CreateArchiveSchema.sql
```

The script enables `pg_trgm`, creates the `archive` schema, and adds missing
tables, columns, functions, and indexes. It does not alter `auth` and does not drop data. Never commit
connection credentials.

## Verification

`backend/tests/Circa.Modules.Archive.Tests` verifies extension/index creation,
unique code and reference behavior, vocabulary mapping, and that a fuzzy
designation lookup can use `ix_incidents_designation_trgm`.

## Stage 2 search upgrade

Run the same SQL script for an existing pre-release database before enabling the
API. It adds `search_text` to all five entities, FTS vectors to dossiers and
recoveries, GIN indexes, case-insensitive holder-prefix expression indexes,
`organizations.legacy_code` with a partial unique index, and the assessments,
access-request, and tombstone tables required for search visibility. These three
tables retain their existing EF relationships and uniqueness rules.

Recovery text includes alternative names through the immutable text-only
`archive.recovery_search_text` SQL helper. Records include their stored code;
parent incident titles are matched separately. Holder expression indexes live in
SQL because EF has no direct expression-index mapping. The rest of the generated
columns and new dependency indexes are mirrored by `ArchiveDbContext`.

The script normalizes known PascalCase assessment/access-decision values from
older EF-created databases to snake_case. It is additive and idempotent; it drops
no rows or columns. Take an operational backup before applying schema changes to
shared databases. Roll back application deployment while retaining the additive
columns/tables/indexes if needed; previous readers can ignore them. Do not drop
these tables as a rollback because they may contain access decisions or votes.
Other scaffolded write-workflow tables remain outside this upgrade's scope.
