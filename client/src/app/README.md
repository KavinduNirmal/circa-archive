# App Router foundation

## Responsibility and structure

- `layout.tsx`: document structure, metadata, dark theme, and local fonts.
- `page.tsx`: intentionally empty home route.
- `globals.css`: Tailwind v4, shadcn semantic tokens, and CIRCA utilities.

## Boundaries

Keep route composition here; reusable components belong in `../components/`. Tokens use detailed DESIGN.md component colors where the specification conflicts. No windows, sample records, or screens are rendered. Run client build and typecheck commands after route changes.
