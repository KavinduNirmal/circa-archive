# Architecture decision records

## Responsibility

Record the architectural decisions that shape CIRCA Archive: what was decided, what forced it, and what it costs. One decision per file, written when the decision is made. An ADR is a historical record — its Decision section is not rewritten after the fact; a later ADR supersedes it instead.

Dated implementation notes distinguish current capabilities from the original
context without rewriting accepted decisions. ADR 004 still governs archive
fixtures; account routes now use the authentication service.

The current design is described in [ARCHITECTURE.md](../../ARCHITECTURE.md). The ADRs explain how the repository arrived there and which alternatives were rejected.

## Structure

- [000-decision.md](000-decision.md): the template. Copy it to a new file; do not fill it in place.
- `NNN-slug.md`: one decision per file. Numbering starts at `001`, is sequential, and is never reused. The slug is lower-case and hyphenated.
- Decisions recorded so far:

| ADR | Decision | Status |
| --- | --- | --- |
| [001](001-locale-prefixed-routing.md) | Every page carries its language in the path | Accepted |
| [002](002-two-reading-surfaces.md) | A server-rendered archive and a client-side workstation over one corpus | Accepted |
| [003](003-markdown-records-no-pdf.md) | Records are Markdown rendered as paper; no PDF generation | Accepted |
| [004](004-fixture-backed-client.md) | The client runs on local fixtures until the backend exists | Accepted |
| [005](005-modular-monolith-backend.md) | The backend is a .NET modular monolith | Accepted, authentication implemented |
| [006](006-session-tokens-in-http-only-cookies.md) | Sessions with short-lived JWTs in HttpOnly cookies | Accepted, implemented |

## Boundaries

- **An ADR records a decision, not a specification.** Behavior belongs in code; a module's rules belong in its folder `README.md`; the current technical contract belongs in [ARCHITECTURE.md](../../ARCHITECTURE.md).
- **Use an ADR for choices that are cross-cutting, expensive to reverse, or constrain later work.** A library swap or a naming preference belongs in the pull request, not here.
- **Statuses are `Proposed`, `Accepted`, `Superseded`, `Deprecated`, or `Rejected`.** A rejected ADR is still worth recording when the alternative is likely to be proposed again.
- **Do not edit an Accepted decision.** Add a new ADR, set `Superseded by` on the old one, and leave the original text intact. Typo fixes and link repairs are the only edits allowed.
- **Do not cite private or ignored paths.** ADRs are published with the repository, so a reference must point at a tracked file or a public URL.

## Usage and verification

To record a decision:

1. Copy `000-decision.md` to the next number and a descriptive slug, for example `docs/adr/007-record-visibility.md`.
2. Set the status to `Proposed`, fill in the context, the decision, and the consequences. Name at least one alternative and say why it lost.
3. Link the code, documents, or external sources that carry the evidence; a decision with no references is a preference.
4. Open a `docs/<topic>` pull request against `develop` ([GITFLOW](../GITFLOW.md)). Discussion happens in review; the merged ADR is the record.
5. Once merged, set the status to `Accepted` in the same pull request if the decision is already in force, or leave it `Proposed` until the implementing change lands.

Check relative links and rendering before opening the pull request, and run `bun run check` from the repository root for folder documentation and whitespace.
