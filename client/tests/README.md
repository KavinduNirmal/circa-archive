# Frontend unit tests

## Responsibility and structure

- `setup.ts`: DOM matchers and cleanup.
- `utils.test.ts`: verifies conditional class composition and Tailwind conflict resolution.

## Usage and boundaries

Run `bun run test` (Vitest with jsdom) or `bun run test:watch` from `client/`. Write failing behavioral tests before implementing future behavior. Browser smoke tests belong in `../e2e/`; root repository tooling tests remain separate.
