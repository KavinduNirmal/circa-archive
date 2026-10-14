# Repository tooling tests

## Responsibility and structure

`check-repository.test.ts` covers folder README requirements, generated-folder exclusions, deduplication, and the distinction between working-tree documentation and staged documentation. Git-index tests use disposable temporary repositories and do not stage files in CIRCA.

## Usage and boundaries

Run `bun run test` from the repository root. Follow red → green → refactor when changing tooling behavior. Put future frontend and backend tests alongside their respective modules; these tests do not validate application behavior.
