# Site incident editor route

## Responsibility and structure

`page.tsx` resolves the locale, sets page metadata, and composes the compact archive frame with the browser-local incident editor.

## Boundaries

The frame keeps archive identity and navigation while omitting the reading pages' classification notice, ticker, and footer. Editing and persistence belong to [the incident editor components](../../../../../components/incident-editor/README.md); the [draft model](../../../../../lib/incident-editor/README.md) owns validation and storage contracts. There are no server submission endpoints here.

## Usage and verification

Visit `/en/site/write/editor` or `/ko/site/write/editor` with the client running. From `client/`, use `bun run test:e2e -- e2e/incident-editor.spec.ts` and `bun run build`.
