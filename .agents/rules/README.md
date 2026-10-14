# Agent rules

## Responsibility

Define mandatory repository development policies. Root `AGENTS.md` requires agents to read these files before editing.

## Structure

- [tdd.md](tdd.md): test-first behavior changes and verification.
- [documentation.md](documentation.md): readable code and folder READMEs.
- [skills.md](skills.md): discovering and evaluating skills from skills.sh.
- [frontend.md](frontend.md): Bun, frontend quality, and hooks.
- [workflow.md](workflow.md): scope, Git safety, and handoff.
- [architecture-security.md](architecture-security.md): domain boundaries and secure implementation.

## Boundaries

Keep durable engineering policies here. Product decisions belong in `../brain/`; module commands belong in folder READMEs. Explicit user instructions and higher-priority agent instructions take precedence. Generated and ignored directories are outside the folder README requirement.
