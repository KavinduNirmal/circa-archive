# 005: The backend is a .NET modular monolith

- **Status:** Accepted — implementation pending
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

The archive's domain has clear seams: records, incidents, organizations, dossiers, votes, moderation, and identity. They share one product, one database, one deployment, and one small team. The real-time features the product wants (vote counts, new-mail notices, adoption events) are low-volume and internal.

At the same time the domain must not become a single layer where every table can reach every other table. Tombstoned records, vote uniqueness, and author-only visibility are the kind of rules that erode when modules can join across each other's data. The first module to be built is authentication and authorization ([ADR 006](006-session-tokens-in-http-only-cookies.md)), which every later module must consume without depending on its internals.

[`ARCHITECTURE.md`](../../ARCHITECTURE.md) already selects .NET 10 Minimal APIs, EF Core, PostgreSQL, and SignalR, and [`backend/README.md`](../../backend/README.md) reserves the folder. Nothing has been implemented.

## Decision

Build one deployable ASP.NET Core 10 service with strong internal module boundaries.

- A single host (`Circa.Api`) composes every module. There are no separate services, queues, or databases between modules.
- Each module is a set of projects: `Domain`, `Application`, `Infrastructure`, and `Contracts`. Only `Contracts` is referenced by other modules; the host references every `Infrastructure` project.
- Each module owns its data: one `DbContext` and one PostgreSQL schema per module, with its own migrations history inside that schema. Cross-module foreign keys are prohibited; other modules store identifiers by value.
- Modules communicate through a contract interface for synchronous lookups and through events for anything asynchronous. Cross-module transactions are discouraged; a workflow that spans modules should be an event, not a shared transaction.
- A shared kernel holds only what at least two modules genuinely need: base types, identifiers, result types, and integration-event contracts.

## Consequences

**Positive.** One deployment, one database, one log stream, and one test host — the operational cost stays small while the domain is small. The project-reference rules make an accidental coupling a build error rather than a code-review obligation. If a module ever needs extraction, its schema and contract already exist.

**Negative.** Microsoft publishes no first-party modular-monolith reference architecture; the closest first-party guidance is microservices-first ([.NET architecture](https://learn.microsoft.com/en-us/dotnet/architecture/)), so the layout follows community practice rather than an official template. Every `dotnet ef` command must name its context. Teams familiar with layered monoliths will look for a shared `DbContext` that deliberately does not exist. A single process means one noisy module can affect the rest.

**Follow-ups.** The layout is recorded as the starting point in the implementation plan, not as a permanent contract. The condition for revisiting is a module whose scaling, deployment, or failure isolation genuinely differs from the rest — at that point a superseding ADR should describe the extraction, not a rewrite.

## Alternatives considered

- **Microservices from the start.** Rejected: distributed transactions, service discovery, and independent deployments are costs the product cannot amortize at this stage, and the domain seams are not yet proven.
- **A layered monolith (UI / application / infrastructure / domain).** Rejected: layers do not stop records from joining organizations' tables, and the product's rules are about entity boundaries, not technical layers.
- **Serverless functions per feature.** Rejected: SignalR, EF Core migrations, and a shared session store fit a long-running service far better, and the operational model would be more complex, not less.
- **Modular monolith with one database per module.** Rejected for now: it buys isolation the product does not need yet and makes cross-module reporting and transactions materially harder.

## References

- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3.1, §3.4, §3.5 — stack, backend responsibilities, schema.
- [`backend/README.md`](../../backend/README.md) — module responsibilities and the test-runner requirement.
- [Milan Jovanović, *How to Build a Modular Monolith in .NET*](https://milanjovanovic.tech/blog/build-modular-monolith-dotnet-step-by-step) — the project layout and Contracts-only references.
- [kgrzybek/modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd) — isolation rules and module composition.
- [EF Core: using a separate migrations project](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/projects) and [transactions](https://learn.microsoft.com/en-us/ef/core/saving/transactions).
