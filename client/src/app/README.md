# App Router

## Responsibility and structure

- `layout.tsx`: document structure, metadata, dark theme, and local fonts.
- `page.tsx`: mounts the desktop at the home route.
- `desktop/`: desktop route and scoped design decisions.
- `globals.css`: theme tokens, CIRCA utilities, workstation chrome, and screen overlay.

## Boundaries and verification

Routes compose reusable components from `../components/`. Backend integration is not implemented; the application screens so far are the archive browser behind Search and the mail client behind Inbox. Run client lint, typecheck, unit tests, and build after changes; browser tests exercise both routes.
