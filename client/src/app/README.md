# App Router

## Responsibility and structure

- `layout.tsx`: document structure, metadata, dark theme, and local fonts.
- `page.tsx`: mounts the desktop at the home route.
- `desktop/`: desktop route and scoped design decisions.
- `globals.css`: theme tokens, CIRCA utilities, workstation chrome, and screen overlay.

## Boundaries and verification

Routes compose reusable components from `../components/`. Backend integration and application contents are not implemented. Run client lint, typecheck, unit tests, and build after changes; browser tests exercise both routes.
