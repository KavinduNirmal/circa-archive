# Account

## Responsibility and structure

`page.tsx` resolves the language, publishes non-indexable metadata, and delegates the `account` view to the shared access page in `components/auth`. Authenticated readers receive the archive-themed account register: a left section index and an anchored details sheet for archive identity, account particulars, and session access. Public profile data comes from `/api/v1/auth/me`; the registration date is shown in the current language using UTC.

## Boundaries and verification

Session state is resolved server-side; account forms use the existing cookie API. UI and translations live outside this route. Run `bun run test` and `bun run test:e2e:auth` from `client/`.
