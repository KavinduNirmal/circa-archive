# Corpus sync

## Responsibility

`sync-corpus.ts` regenerates `src/components/reader/ghost-story.ts` from `public/Ghost_story.md`, the published record corpus. `public/Ghost_story.md` is the file an editor changes; the browser cannot read a file at runtime, so the same document is bundled as data for the reader. This script is the only writer of that bundle.

Run it from `client/` after editing the published copy:

```sh
bun run sync:corpus
```

`tests/ghost-story-sync.test.ts` holds the generator's output against the committed module, and `tests/record-sources.test.ts` holds the module byte-identical to the published file. Editing only one of the two therefore fails the suite rather than reaching the reader as a stale copy.

## Structure and boundaries

`escapeTemplate` escapes only what a template literal would otherwise reinterpret: backslashes, backticks, and the `${` interpolation opener. Nothing else about the document changes, which is what keeps the bundle byte-identical to the file it was generated from. The script writes the bundle's header comment as well, so the generated module carries its own provenance.

The published corpus is test content, not a second source of truth. Do not restate or tidy its prose here, and do not add a second copy of the document to the client bundle.
