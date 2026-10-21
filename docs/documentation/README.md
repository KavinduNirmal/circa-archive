# Website documentation

## Responsibility and structure

Public technical articles for the independent [Astro project website](../../meta/README.md). [en/](en/README.md) and [ko/](ko/README.md) contain translated articles. The website's explicit registry groups them into Overview, Lore, Contribution and Building, alongside the public lore index and author guide.

## Authoring and boundaries

Article prose, headings and formatting live in these Markdown files. UI labels and reading order live in the Astro package. Documentation describes implemented behavior; platform plans remain in [ARCHITECTURE.md](../../ARCHITECTURE.md), and public fictional knowledge remains in [lore](../lore/README.md). Private lore is never a build input.

The site builds from the checked-out registry sources. Edit locally, restart development to refresh the collection, and build/deploy to publish. There are no runtime GitHub fetches or embedded fallbacks. Missing registered documents fail the build. `PROJECT_DOCUMENTATION_REF` controls GitHub source/edit links only. Last-updated dates use available build-time Git history and are omitted when unverifiable.

Registered relative links remain in the reader's language, retaining fragments and queries. Other public repository files link to GitHub. The registered lore diagram is served locally. Keep assets explicitly registered; never copy all documentation or private notes into public output. Use GFM, tables, tasks, footnotes, fenced code, GitHub alerts, highlighting and the existing brand blocks. Raw HTML is inert; fictional record redaction transforms never run on documentation examples. Heading IDs are assigned before the source H1 is removed, so existing links remain stable.

The four chapter groups collapse while articles stay expanded. Search lazily loads a generated per-language index. Ctrl/Cmd+K focuses it; Escape clears it. Search opens matching groups and restores their prior state when cleared. The current chapter is open on arrival; session storage remembers other choices. Navigation and reading work without JavaScript; search and clipboard controls are enhancements.

Copy Markdown copies the exact built source. Open in ChatGPT copies context and opens ChatGPT for manual pasting; nothing is sent automatically. The article footer links to the exact source editor. Unavailable search or clipboard access produces visible recovery feedback.

## Usage and verification

Add articles in both languages and register them in `meta/src/lib/registry.ts`. Run `bun run check`, `bun run check:meta`, `bun run --cwd meta build`, and `bun run --cwd meta test:e2e`. Run client checks when modifying the archive. See the [Building guide](en/building.md).
