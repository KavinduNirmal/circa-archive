# Circa.Common.Application

## Responsibility

Defines cross-cutting application contracts, command and query interfaces, pipeline behavior markers, and common identifiers.

## Structure

References `Circa.Common.Domain`. Provides interfaces for dispatcher behaviors, validation, and domain-agnostic identifiers (such as `UserId`).

## Boundaries

Independent of UI/HTTP frameworks and persistence implementations (EF Core, SQL). Domain modules may reference this project to share common application primitives.
