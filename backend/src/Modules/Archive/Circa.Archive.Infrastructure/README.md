# Circa.Archive.Infrastructure

## Responsibility

Implements archive persistence for the `archive` PostgreSQL schema.

## Structure

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

No endpoints, handlers, repositories, or seeding are implemented. The module
registration exists so the schema can be initialized and future consumers can
resolve the context. Raw SQL is the schema source of truth; the EF model must be
kept aligned when entities change.
