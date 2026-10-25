# Archive Module

## Responsibility

Owns the persistent archive entity model and its PostgreSQL `archive` schema:
incidents, filings (records), record tags, organizations, characters, and
recoveries. This scaffold covers models, relationships, constraints, and search
indexes. It intentionally contains no HTTP endpoints, write workflows, or query
handlers yet.

## Structure

- `Circa.Archive.Domain/`: entity classes and vocabulary enums.
- `Circa.Archive.Infrastructure/`: EF Core `ArchiveDbContext`, snake_case/archive
  value mappings, schema initialization, and module registration.

## Boundaries

The module exclusively manages the `archive` schema. It stores `author_id`,
`filed_by_id`, and other account identifiers as UUIDs without cross-module
foreign keys; account lookup belongs to Auth contracts when CRUD is introduced.
Other modules must not query archive tables directly. Archive DTOs and public
contracts will be added with the first consumer, not in this scaffold.

IDs are UUIDs supplied by the application (UUIDv7). Display codes such as
`INC-007540`, `EXP-288902`, and `ITM-000001` are unique display identifiers, never
database keys. Reserved ranges remain an application concern; the schema only
enforces uniqueness and non-negative sequence numbers.

## Schema initialization

Development startup creates the Auth schema first, then runs
`CreateArchiveSchema.sql`. The script is idempotent and additive, so it also
creates the archive tables in an existing local database without touching
`auth`. See [Persistence](Circa.Archive.Infrastructure/Persistence/README.md) for
the index rationale and manual upgrade command.

## Usage

Register the module with `services.AddArchiveModule(configuration)` and initialize
with `ArchiveSchemaInitializer.EnsureAsync(context)` after the database exists.
Tests use a disposable PostgreSQL container and are run with:

```sh
dotnet test backend/tests/Circa.Modules.Archive.Tests
```
