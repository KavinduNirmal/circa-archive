# Common Libraries

## Responsibility

Houses shared abstractions, cross-cutting primitives, and baseline infrastructure components reused across domain modules.

## Structure

- `Circa.Common.Domain/`: Core domain primitives, value object base types, and domain event interfaces.
- `Circa.Common.Application/`: Application-layer contracts, common messaging abstractions, and shared errors.
- `Circa.Common.Infrastructure/`: Shared data access helpers, time providers, serialization, and background task abstractions.

## Boundaries

`Common` projects are strictly domain-agnostic. They must never reference domain modules (`Modules/*`). Domain modules may depend inward on `Common`, but `Common` must never depend on any module.
