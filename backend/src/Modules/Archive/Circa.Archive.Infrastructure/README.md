# Circa.Archive.Infrastructure

## Responsibility

Implements archive persistence and the global search read API over the `archive`
PostgreSQL schema.

## Structure

- `Search/`: parameterized SQL read model, visibility, endpoint, and rate limiting;
  see its [contract and decisions](Search/README.md).

- `Persistence/ArchiveDbContext.cs`: entity mappings, table/column names,
  constraints, relationships, search indexes, and generated full-text columns.
- `Persistence/ArchiveValueConverters.cs`: archive vocabulary stored in
  lower_snake_case, plus `EXP`/`EVI`/`RUM` record type codes.
- `Persistence/CreateArchiveSchema.sql`: idempotent schema and index creation.
- `Persistence/ArchiveSchemaInitializer.cs`: executes the embedded schema script.
- `ArchiveModuleExtensions.cs`: registers `ArchiveDbContext` under the `Archive`
  connection string, falling back to `Auth` because both schemas share one
  database in the modular monolith.

## Boundaries

Global search is implemented; archive CRUD, destination read endpoints, and
production seeding remain pending. Registration supplies the context, reader,
and search rate-limit policy. Raw SQL is the schema source of truth; the EF model must be
kept aligned when entities change.
