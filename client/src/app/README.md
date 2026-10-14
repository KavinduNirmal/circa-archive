# App Router

## Responsibility and structure

- `layout.tsx`: document structure, metadata and its title template, dark theme, and local fonts.
- `page.tsx`: the public landing page at `/`, with its own absolute title and social metadata.
- `desktop/`: the workstation route at `/desktop` and scoped design decisions.
- `globals.css`: theme tokens, CIRCA utilities, workstation chrome, the public landing page, the boot screen, and the screen overlay.

## Boundaries and verification

Routes compose reusable components from `../components/`. `/` is the one screen outside the fiction: it introduces the project, states its real status and commands, and links into the workstation. `/desktop` plays the post screen before the shell, so the workstation is entered rather than merely loaded. Backend integration is not implemented; the application screens are the archive browser behind Search, the mail client behind Inbox, the file browser behind every folder destination, and the record editor behind CIRCA Word. Run client lint, typecheck, unit tests, and build after changes; browser tests exercise both routes.
