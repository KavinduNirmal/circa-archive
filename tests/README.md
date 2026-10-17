# Repository tooling tests

## Responsibility and structure

`check-repository.test.ts` covers folder README requirements, the `.github` exemption, the guard against `.github/README.md` replacing the repository README, generated-folder exclusions, deduplication, and the distinction between working-tree documentation and staged documentation. Git-index tests use disposable temporary repositories and do not stage files in CIRCA. They spawn git with its own variables removed: a partial commit exports an absolute `GIT_INDEX_FILE` to its hooks, and a scratch repository that inherited it would stage its fixtures into CIRCA's index, against blobs its own object store is about to lose.

## Usage and boundaries

Run `bun run test` from the repository root. Follow red → green → refactor when changing tooling behavior. Put future frontend and backend tests alongside their respective modules; these tests do not validate application behavior.
