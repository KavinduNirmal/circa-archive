# Character dossier route

## Responsibility

Render a public character dossier reached from global search.

## Structure

- `page.tsx` resolves the character code through the archive destination API.

## Boundaries

This route owns destination loading and route metadata. The shared dossier presentation is in `components/archive-site`; character editing and usage authorization remain backend responsibilities.

## Usage and verification

The route is dynamic and uses `SEARCH_SOURCE=api`; it requests `/api/v1/archive/{code}` and returns 404 when the character is not public or does not exist.
