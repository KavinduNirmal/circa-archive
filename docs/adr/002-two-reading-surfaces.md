# 002: A server-rendered archive and a client-side workstation over one corpus

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

CIRCA Archive has two public faces with different jobs. The archive is a reading product: it must be searchable, linkable, indexable, and readable without JavaScript. The workstation is a period desktop shell: draggable windows, a Start menu, a taskbar, and a CRT overlay, which only makes sense as a client-side interface.

Both must show the same records. A second copy of the corpus, or a second Markdown renderer, would drift and would contradict the fiction that a record is one artifact.

The repository already splits the routes: `client/src/app/[lang]/site/` holds the archive (including `site/records/[code]/page.tsx`), while `client/src/app/[lang]/(workspace)/desktop/` holds the workstation. [ADR 003](003-markdown-records-no-pdf.md) made the renderer a single shared pipeline for the same reason.

## Decision

Serve two surfaces over one corpus, and make the archive the canonical address for a record.

- The public archive under `/{lang}/site` is server-rendered and works without JavaScript. Record pages are addressed by archive code at `/{lang}/site/records/{code}`.
- The workstation under `/{lang}/desktop` is a client-side shell. Window geometry, stacking, focus, and the reader trail are client state; the shell owns them.
- Both surfaces read the same record data and use the same Markdown pipeline ([`client/src/lib/markdown`](../../client/src/lib/markdown/README.md)); the archive's record page and the workstation's reader must render the same document.
- When a record needs a shareable, indexable URL, the archive's URL is that URL. The workstation's location is a workspace position, not a publication address.

## Consequences

**Positive.** The archive is crawlable, linkable, fast on first paint, and usable without JavaScript. The workstation keeps the interaction fidelity the fiction needs without compromising the reading edition. One corpus and one renderer prevent the two surfaces from disagreeing.

**Negative.** There are two presentation layers to maintain, and a change to a record's presentation can require touching both. The workstation is not indexable, and its content ships in the client bundle. The shared pipeline becomes a coupling point: changing it changes both surfaces at once.

**Follow-ups.** The backend will make both surfaces read from the API instead of local fixtures ([ADR 004](004-fixture-backed-client.md) records the interim). User-specific workstation pages will need authenticated rendering once sessions exist ([ADR 006](006-session-tokens-in-http-only-cookies.md)). The workstation's deep-link scheme is being introduced separately and does not change the archive's canonical addresses.

## Alternatives considered

- **A single-page application for both surfaces.** Rejected: the archive would lose server rendering, no-JavaScript reading, and reliable indexing, which are the reading product's requirements.
- **A server-rendered workstation.** Rejected: window dragging, stacking, and reader state are inherently client-side, and server rendering them would add complexity without improving the fiction.
- **Two independent applications on separate deployments.** Rejected for a single-team pre-release product: duplicated routing, i18n, and design system, and two places to keep the corpus consistent.

## References

- [`README.md`](../../README.md) — the two public faces and the current status.
- [`client/README.md`](../../client/README.md) — the route map, the workstation shell, and the localization split.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3.3 and §5 — frontend architecture and the desktop specification.
