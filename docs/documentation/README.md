# Website documentation

## Responsibility and structure

The public developer manual served at `/{lang}/meta/documentation`.
[en/](en/README.md) and [ko/](ko/README.md) contain the same nine topics in
English and Korean. The Markdown files own the article text, formatting, and
headings; the client registry owns navigation labels and reading order.

## Boundaries and decisions

These files replace article bodies previously embedded in JSX and translation
catalogs. They document implemented client behavior; platform plans remain in
[ARCHITECTURE.md](../../ARCHITECTURE.md), and fictional lore remains in
[../lore/](../lore/README.md).

The website fetches public raw files from GitHub's `develop` branch, using
`PROJECT_REPOSITORY_URL` and optional `PROJECT_DOCUMENTATION_REF` server settings.
The repository override must be an HTTPS GitHub owner/repository address.
Set overrides in the client runtime environment (or `client/.env.local`).
Next.js caches successful fetches and revalidates after 300 seconds; requests
have a ten-second timeout. New files must be published to the configured ref
before the website can display them. There is no embedded content fallback.
Loading and failure messages are localized, with retry and source links.

Each page loads the registered documents for its locale concurrently. Search
matches titles and raw Markdown across those documents; the project header opens
it from any meta page, and Ctrl/Cmd+K focuses it,
including opening the mobile contents disclosure. Escape clears the query.
Unavailable articles remain navigable by title and a partial-search notice
explains missing content. Reading order and previous/next links never change.

Relative document links stay in the localized manual when the target is
registered. Other relative files open on GitHub at the same ref; images resolve
to raw files relative to their source. Fragments and query strings survive.
Use GFM tables, tasks, strikethrough and footnotes, fenced code, and GitHub
`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` blockquotes.
Frontmatter is hidden, raw HTML is not executed, and code examples remain literal.
The contents rail and heading links derive from the rendered Markdown pipeline.

The title is followed by compact Copy Markdown and Open in ChatGPT actions.
Copy Markdown copies the unmodified fetched source with success/failure feedback.
Open in ChatGPT starts copying the source URL and Markdown as question context
and opens ChatGPT in a new tab. The reader pastes the context and writes their
question; nothing is automatically sent. Clipboard failures remain visible on
this page.

The article footer places the last-updated date on the left and Edit documentation
on the right. Editing opens the exact locale file in GitHub's editor. Dates come
from the latest commit affecting that source path at the configured ref, formatted
in the reader's locale using UTC. File history is cached for one hour to limit
unauthenticated GitHub API requests. Missing history, rate limits, and malformed
dates omit the timestamp; they never prevent reading the article.

## Usage and verification

Edit both language files when content changes. Use relative Markdown links such
as `[Rendering](rendering.md)`. Add a topic to the client registry and both
language directories together. Run `bun run check`, `bun run check:client`, and
`bun run --cwd=client build`. The source and experience tests cover fetching,
relative links, rendering, search, keyboard focus and clipboard behavior.
