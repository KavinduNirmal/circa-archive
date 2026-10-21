# Feature Modules

## Responsibility

Hosts self-contained domain feature modules composing the CIRCA modular monolith.

## Structure

- `Auth/`: User identity, password verification, session lifecycle, token issuance, and authorization policies.

Future modules will include `Records/`, `Incidents/`, `Organizations/`, `Votes/`, and `Moderation/`.

## Boundaries

Every module enforces high internal cohesion and loose coupling:

1. Each module owns its dedicated database schema (`auth`, `records`, etc.).
2. Cross-module database foreign keys and direct table `JOIN`s are forbidden.
3. Inter-module communication occurs exclusively via public types and interfaces defined in `*.Contracts`.
4. No module references the `Infrastructure`, `Application`, or `Domain` layers of another module.
