# Reusable components

## Responsibility and structure

`ui/` owns shadcn/ui primitives with CIRCA styling. They are available for future screens and are not mounted by the scaffold.

## Boundaries

Keep reusable presentation here; domain behavior and API integration do not belong in primitive components. Introduce feature folders only when needed and document their ownership. Run client lint, typecheck, and build after changing components.
