# Account

## Responsibility and structure

`page.tsx` resolves the language, publishes non-indexable metadata, and delegates the `account` view to the shared access page in `components/auth`.

## Boundaries and verification

Session state is resolved server-side; account forms use the existing cookie API. UI and translations live outside this route. Run `bun run test` and `bun run test:e2e:auth` from `client/`.
