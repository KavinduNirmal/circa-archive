# Frontend unit tests

## Responsibility and structure

- `setup.ts`: DOM matchers and cleanup.
- `utils.test.ts`: class composition and Tailwind conflict resolution.
- `desktop.test.tsx`: folder navigation, Escape dismissal, and Start launcher behavior.

## Usage and boundaries

Run `bun run test` or `bun run test:watch` from `client/`. Browser interaction and responsive checks belong in `../e2e/`; repository tooling tests remain separate.
