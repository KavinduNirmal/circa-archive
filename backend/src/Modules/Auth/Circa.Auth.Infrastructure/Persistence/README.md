# Persistence

## Responsibility and structure

Owns the `auth` schema and EF Core persistence:

- `AuthDbContext.cs`: Identity user context, private profile/IP mappings, unique
  normalized usernames/emails and display IDs, and cascading session ownership.
- `RegistrationUserStore.cs`: translates concurrent username/email conflicts to
  Identity validation results and retries generated display-ID collisions.
- `ExtendUserProfiles.sql`: transactional, additive upgrade from the original
  pre-profile `auth.users` schema. Run once, with API writers stopped.

## Boundaries

Other modules use auth contracts rather than querying these tables. Real email,
password hashes, IP history and moderation state are private; display email is a
computed property and is never an Identity email address. The organization UUID
has no foreign key until the organization module provides its contract.

## Schema upgrade and verification

Fresh test/browser databases use `EnsureCreatedAsync` with the current model.
`EnsureCreatedAsync` does not upgrade an existing database. There is no EF
migration history in this pre-release backend; this patch supplies an explicit
SQL upgrade rather than introducing an incompatible initial migration.

Back up the existing database, stop API writers, then apply once:

```sh
psql "$CIRCA_AUTH_CONNECTION" -v ON_ERROR_STOP=1 -f backend/src/Modules/Auth/Circa.Auth.Infrastructure/Persistence/ExtendUserProfiles.sql
```

The connection variable is a libpq connection string/URL supplied locally; never
commit credentials. The transaction preserves UUIDs, password hashes, users and
sessions, allocates existing accounts sequential nine-digit display IDs, assigns
a valid placeholder analyst name, backfills update time, and bans accounts with
five or more strikes. New accounts receive random display IDs and UUIDv7 IDs.
Duplicate normalized emails abort the entire upgrade; resolve duplicates with
account owners before retrying. Existing usernames and hashes are retained;
stricter registration validation does not force existing users to reset passwords.
Do not rerun the script on an upgraded database. Roll back a failed transaction
normally; recovery after deployment requires the backup and previous application
version. No destructive down migration or automatic startup upgrade is provided.

Run `dotnet test backend/Circa.sln` from the root (Docker required). The tests cover
profile persistence, collision retries, account access, concurrent registration,
and upgrading a disposable copy of the former schema.
