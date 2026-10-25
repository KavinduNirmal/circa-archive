# Archive Module

## Responsibility

Owns the persistent archive entity model and its PostgreSQL `archive` schema:
incidents, filings (records), record tags, organizations, characters, and
recoveries. It implements models, relationships, search indexes, and the global
search read endpoint. Archive write workflows and destination read pages remain pending.

## Structure

- `Circa.Archive.Domain/`: entity classes and vocabulary enums.
- `Circa.Archive.Application/`: transport-independent global search contracts, validation,
  code/vocabulary interpretation, and plain-text helpers.
- `Circa.Archive.Infrastructure/`: EF Core `ArchiveDbContext`, snake_case/archive
  value mappings, schema initialization, SQL search reader, HTTP endpoint, and rate limiting.

## Boundaries

The module exclusively manages the `archive` schema. It stores `author_id`,
`filed_by_id`, and other account identifiers as UUIDs without cross-module
foreign keys; account lookup belongs to Auth contracts when CRUD is introduced.
Other modules must not query archive tables directly. Search request contracts
live in Application. The public search endpoint supports all five entity types;
the client enables only types with destinations and retains fixture transport
until stage 3.

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
