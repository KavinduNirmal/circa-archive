# Backend Source

## Responsibility

Contains the source code for the CIRCA backend services, including the runnable API host, cross-cutting common layers, and isolated domain feature modules.

## Structure

- `Circa.Api/`: Executable ASP.NET Core host, composition root, middleware, and route registrations.
- `Common/`: Cross-cutting primitives and shared infrastructure (base domain models, application abstractions, common persistence concerns) free of domain module dependencies.
- `Modules/`: Self-contained domain modules (such as `Auth`) implementing their own domain logic, data models, and contracts.

## Boundaries

- Projects in `Common/` must never reference projects in `Modules/`.
- Cross-module communication must only occur through `*.Contracts` projects.
- Only the host (`Circa.Api`) references module infrastructure implementations directly for dependency injection setup.
