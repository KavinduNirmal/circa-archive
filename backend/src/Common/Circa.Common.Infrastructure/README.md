# Circa.Common.Infrastructure

## Responsibility

Implements cross-cutting infrastructure services: time providers, interceptors, generic EF Core configuration helpers, and logging utilities.

## Structure

References `Circa.Common.Application`. Houses shared persistence conventions and technical adapters.

## Boundaries

May reference database and serialization libraries. Does not reference any module-specific infrastructure or domain logic.
