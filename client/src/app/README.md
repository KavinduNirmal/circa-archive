# App Router

## Responsibility and structure

- `layout.tsx`: document structure, metadata and its title template, dark theme, and local fonts.
- `page.tsx`: the public landing page at `/`, with its own absolute title and social metadata.
- `desktop/`: the workstation route at `/desktop` and scoped design decisions.
- `globals.css`: the design tokens, the Tailwind theme bridge, base rules, and only the shared CIRCA utilities. Every component-specific stylesheet lives beside the component that owns it, under `../components/`.

## Boundaries and verification

Routes compose reusable components from `../components/`. `/` renders the agency portal with its scoped stylesheet in `../components/site/`, public procedures, and diegetic route metadata. `/desktop` plays the post screen before the shell, so the workstation is entered rather than merely loaded. Backend integration is not implemented; the application screens are the archive browser behind Search, the mail client behind Inbox, the file browser behind every folder destination, and the record editor behind CIRCA Word. Run client lint, typecheck, unit tests, and build after changes; browser tests exercise both routes.
