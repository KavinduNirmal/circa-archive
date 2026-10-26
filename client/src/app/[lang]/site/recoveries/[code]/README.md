# Recovery registry route

## Responsibility

Render an active recovery registry entry reached from global search.

## Structure

- `page.tsx` resolves the recovery code through the archive destination API.

## Boundaries

This route owns destination loading and route metadata. The shared dossier presentation is in `components/archive-site`; registry changes remain backend responsibilities.

## Usage and verification

The route is dynamic and uses `SEARCH_SOURCE=api`; it requests `/api/v1/archive/{code}` and returns 404 when the recovery is not active or does not exist.
